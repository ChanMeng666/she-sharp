/**
 * Atomically record one channel's sync state into the committed manifest
 * (state/sync-state.json). Keeps Claude from hand-editing the manifest, and
 * computes the deterministic content fingerprint from events-custom.json so the
 * next run can short-circuit unchanged events to a no-op.
 *
 * The watermark + thread map come straight from a fetch-channel.ts payload via
 * --from, so the normal flow is:
 *
 *   npx tsx .../fetch-channel.ts <ch> --state > out.json
 *   # …sync the event into events-custom.json…
 *   npx tsx .../update-state.ts --from out.json --mapping event --slug <slug> --event-id <id>
 *
 * Mapping forms:
 *   --mapping event  --slug <slug> --event-id <n>            (repeatable for multi-event channels)
 *   --mapping skip   --reason "<why>" | --reason-file <path>
 *   --mapping none
 *
 * OMIT --mapping to KEEP the channel's existing mapping untouched — reason,
 * events and always-read included. That is the safe default for a plain "record
 * that I have read this" write, and it means re-recording a mapped channel no
 * longer requires echoing its mapping back on the command line. Use
 * `--mapping none` to actually clear one.
 *
 * Batch:
 *   --batch <file.json>          an array of argv arrays, applied in one process
 *                                against one loaded manifest. All-or-nothing.
 *
 * Other flags:
 *   --from <fetch-output.json>   pull channel id/name, watermark, threadState
 *   --channel <id> --name <n> --watermark <ts>   (manual, when no --from)
 *   --type event|general         (default: inferred from name)
 *   --commit <sha>               record the commit that carried this sync
 *   --read-source "<text>"       qualify this receipt: the position is recorded,
 *                                but the claim is narrower than "somebody read
 *                                every message". Use for bulk registration.
 *   --digest "<text>"            sediment what was understood this run (event
 *                                state + open items); carried back next run so
 *                                Slack isn't re-read. Repeat to read from a file
 *                                with --digest-file <path> instead. Omit to keep
 *                                the prior digest; --digest "" clears it.
 */

import {
  classifyChannel,
  fingerprintForMapping,
  loadManifest,
  nowIso,
  carryReadReceipt,
  readPayload,
  saveManifest,
  shouldInheritMapping,
  type ChannelState,
  type Mapping,
  type ThreadState,
} from "./state-lib";
import { readFileSync } from "node:fs";

function argFrom(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

/** Collect repeated --slug / --event-id pairs (positional pairing by order). */
function collectEvents(argv: string[]): { slug: string; eventId: number }[] {
  const slugs: string[] = [];
  const ids: number[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--slug") slugs.push(argv[i + 1]);
    if (argv[i] === "--event-id") ids.push(Number(argv[i + 1]));
  }
  return slugs.map((slug, i) => ({ slug, eventId: ids[i] }));
}

/**
 * Apply ONE state write to an in-memory manifest. Does not save.
 *
 * Takes its argv explicitly so `--batch` can run hundreds of these in a single
 * process against a single loaded manifest, instead of paying a tsx startup and
 * a 500 KB parse-and-write per conversation.
 */
function applyOne(
  argv: string[],
  manifest: ReturnType<typeof loadManifest>,
): { changed: boolean; label: string; summary?: unknown } {
  const arg = (name: string) => argFrom(argv, name);
  const fromFile = arg("--from");
  let channelId = arg("--channel");
  let name = arg("--name");
  let watermarkTs = arg("--watermark");
  let threads: Record<string, ThreadState> = {};

  if (fromFile) {
    const payload = readPayload(fromFile);
    channelId = channelId ?? payload.channel?.id;
    name = name ?? payload.channel?.name;
    watermarkTs = watermarkTs ?? payload._meta?.newWatermarkTs;
    threads = payload._meta?.threadState ?? {};
  }

  if (!channelId || !name || !watermarkTs) {
    throw new Error("Need --channel, --name, --watermark (or --from <fetch-output.json>)");
  }

  const type = (arg("--type") as "event" | "general") ?? classifyChannel(name);

  // `--always-read` is sticky, so the skip branch has to see what the channel
  // was already carrying — hence prev is read before the mapping is built.
  const prev = manifest.channels[channelId];

  /*
   * Build the mapping.
   *
   * OMITTING `--mapping` INHERITS THE PREVIOUS ONE. It used to default to
   * `none`, which meant a routine "record that I read this" on an already-mapped
   * channel silently rewrote its mapping to none — destroying an event linkage,
   * or a `skip` whose reason was a paragraph of hard-won context, with no
   * warning and no diff anybody would think to check.
   *
   * The old default also made every re-record dangerous in a subtler way: the
   * safe workaround was to read the current mapping out of the manifest and echo
   * it back on the command line, which meant piping long human prose containing
   * apostrophes through a shell. On 12 August 2026 that came within one step of
   * committing 41 mangled reasons to a public repo, because PowerShell escapes a
   * quote by doubling it and bash does not.
   *
   * Clearing a mapping is now something you have to say: `--mapping none`.
   */
  const kindArg = arg("--mapping");
  const kind = kindArg ?? (prev?.mapping?.kind ?? "none");
  const inheriting = shouldInheritMapping(prev, kindArg);
  let mapping: Mapping;
  let fingerprint = "";
  if (inheriting) {
    /* Inherit wholesale — reason, events and alwaysRead included. Re-deriving
       any of it from flags that were not passed is how the field gets dropped. */
    mapping = prev!.mapping;
    fingerprint = mapping.kind === "event" ? fingerprintForMapping(mapping) : "";
  } else if (kind === "event") {
    const evs = collectEvents(argv);
    if (!evs.length || evs.some((e) => !e.slug || !Number.isFinite(e.eventId))) {
      throw new Error("--mapping event requires at least one --slug + --event-id pair");
    }
    mapping = { kind: "event", events: evs };
    fingerprint = fingerprintForMapping(mapping);
  } else if (kind === "skip") {
    /* `--reason-file` mirrors `--digest-file`, and exists for the same reason:
       these are sentences written for a human, they contain apostrophes and em
       dashes, and putting them on a command line makes their correctness a
       property of which shell happens to be running. A file has no such
       property. An explicit `--reason` still wins. */
    const reasonFile = arg("--reason-file");
    const reason =
      arg("--reason") ??
      (reasonFile ? readFileSync(reasonFile, "utf8").trim() : undefined) ??
      (prev?.mapping?.kind === "skip" ? prev.mapping.reason : undefined) ??
      "skipped";
    /*
     * `--always-read` keeps a conversation out of the create? pool while still
     * forcing it into the triage on any new content. It exists for the DMs of
     * the people who send work — they feed no page, so `skip` is right, but a
     * skip that hides them is how "please update Carolina Lobos' profile" went
     * unread for a day. Sticky: once set it survives later state writes unless
     * `--no-always-read` clears it.
     */
    const flagged = argv.includes("--always-read");
    const cleared = argv.includes("--no-always-read");
    const previous =
      prev?.mapping?.kind === "skip" ? prev.mapping.alwaysRead : undefined;
    const alwaysRead = cleared ? false : flagged || previous;
    mapping = alwaysRead
      ? { kind: "skip", reason, alwaysRead: true }
      : { kind: "skip", reason };
  } else {
    mapping = { kind: "none" };
  }

  const mergedThreads = { ...(prev?.threads ?? {}), ...threads };

  // Digest: explicit --digest/--digest-file wins; otherwise inherit the prior.
  const digestFile = arg("--digest-file");
  const digestArg = digestFile ? readFileSync(digestFile, "utf8").trim() : arg("--digest");
  const digest = digestArg !== undefined ? digestArg.trim() : prev?.digest ?? "";
  const digestAt = digestArg !== undefined && digestArg.trim() ? nowIso() : prev?.digestAt ?? "";

  /*
   * Recording a read also settles the scan: the model has now seen at least as
   * much as the triage scored, so the two positions meet. They can only diverge
   * again the next time the triage scores something nobody opened.
   */
  const scannedTs =
    Number(prev?.scannedTs ?? 0) > Number(watermarkTs)
      ? prev!.scannedTs!
      : watermarkTs;

  /*
   * A DELIVERY RETIRES THE BACKLOG MARKER IT SATISFIES.
   *
   * `pendingTs` is what the triage saw in Slack on a row it could not clear.
   * Once a payload has delivered content at least that far, the marker has done
   * its job and keeping it would leave `audit-read-state.ts` red on a
   * conversation that was in fact read. A marker still ahead of the delivered
   * watermark is kept: a partial read is not a read.
   */
  const pendingTs =
    prev?.pendingTs && Number(prev.pendingTs) > Number(watermarkTs)
      ? prev.pendingTs
      : undefined;

  const next: ChannelState = {
    name,
    type,
    mapping,
    watermarkTs,
    scannedTs,
    ...(pendingTs ? { pendingTs } : {}),
    threads: mergedThreads,
    fingerprint: fingerprint || (kind === "event" ? prev?.fingerprint ?? "" : ""),
    lastSyncedAt: nowIso(),
    // Only a payload is evidence the content reached the model; `--channel`
    // + `--watermark` by hand records a mapping, not a read. The rule, and why
    // readAtSource travels with the receipt, is in carryReadReceipt().
    ...carryReadReceipt(prev, !!fromFile, nowIso(), arg("--read-source")),
    lastSyncedCommit: arg("--commit") ?? prev?.lastSyncedCommit ?? "",
    ...(digest ? { digest, digestAt } : {}),
  };

  // Avoid timestamp churn: if nothing material changed, keep the prior entry
  // (incl. its lastSyncedAt) so a no-op re-record leaves the manifest byte-stable.
  /* `readAt` is compared as presence, not value, so a re-record does not churn a
     timestamp. `readAtSource` is compared by VALUE: it is the qualifier on the
     claim, and a write that narrows or widens what the manifest asserts about a
     conversation is material by definition. Leaving it out made
     `--read-source` a silent no-op. */
  const material = (c?: ChannelState) =>
    c && JSON.stringify({ n: c.name, t: c.type, m: c.mapping, w: c.watermarkTs, s: c.scannedTs ?? "", p: c.pendingTs ?? "", r: c.readAt ? "y" : "", rs: c.readAtSource ?? "", th: c.threads, f: c.fingerprint, d: c.digest ?? "" });
  if (prev && material(prev) === material(next)) {
    return { changed: false, label: `${channelId} (${name})` };
  }
  manifest.channels[channelId] = next;

  return {
    changed: true,
    label: `${channelId} (${name})`,
    summary: {
      channel: channelId,
      name,
      type,
      mapping,
      watermarkTs,
      threadCount: Object.keys(next.threads).length,
      fingerprint: next.fingerprint,
      digest: next.digest ?? "",
    },
  };
}

/**
 * `--batch <file.json>` — an array of argv arrays, applied in order.
 *
 *   [ ["--from","raw/C1.json"],
 *     ["--from","raw/C2.json","--mapping","skip","--reason","…"] ]
 *
 * One process, one manifest load, one save. Recording 105 conversations used to
 * mean 105 tsx startups and 105 round trips through a 500 KB JSON file for what
 * is purely local work.
 *
 * It also takes the reasons off the command line entirely, which is the point:
 * these strings contain apostrophes, and passing them through a shell made their
 * correctness depend on which shell was running. JSON has one quoting rule.
 *
 * All-or-nothing. An entry that throws aborts before anything is written, so a
 * malformed batch cannot leave the manifest half-updated — the failure mode
 * would otherwise be a partially-recorded ingest that every gate calls clean.
 */
function main() {
  const argv = process.argv.slice(2);
  const batchFile = argFrom(argv, "--batch");
  const manifest = loadManifest();

  if (batchFile) {
    const entries = JSON.parse(readFileSync(batchFile, "utf8")) as string[][];
    if (!Array.isArray(entries) || entries.some((e) => !Array.isArray(e))) {
      console.error("--batch expects a JSON array of argv arrays");
      process.exit(2);
    }
    let changed = 0;
    entries.forEach((entry, i) => {
      try {
        if (applyOne(entry, manifest).changed) changed++;
      } catch (e: any) {
        console.error(`entry ${i + 1}/${entries.length} failed: ${e?.message ?? e}`);
        console.error("nothing was written — fix the batch and re-run");
        process.exit(2);
      }
    });
    if (changed) saveManifest(manifest);
    process.stdout.write(
      `${changed} of ${entries.length} entries changed; ${entries.length - changed} already current.\n`,
    );
    return;
  }

  const r = applyOne(argv, manifest);
  if (!r.changed) {
    process.stdout.write(`no change for ${r.label}\n`);
    return;
  }
  saveManifest(manifest);
  process.stdout.write(JSON.stringify(r.summary, null, 2) + "\n");
}

main();
