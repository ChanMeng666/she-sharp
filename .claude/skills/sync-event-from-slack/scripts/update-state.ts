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
 *   --mapping skip   --reason "<why>"
 *   --mapping none
 *
 * Other flags:
 *   --from <fetch-output.json>   pull channel id/name, watermark, threadState
 *   --channel <id> --name <n> --watermark <ts>   (manual, when no --from)
 *   --type event|general         (default: inferred from name)
 *   --commit <sha>               record the commit that carried this sync
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
  readPayload,
  saveManifest,
  type ChannelState,
  type Mapping,
  type ThreadState,
} from "./state-lib";
import { readFileSync } from "node:fs";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Collect repeated --slug / --event-id pairs (positional pairing by order). */
function collectEvents(): { slug: string; eventId: number }[] {
  const slugs: string[] = [];
  const ids: number[] = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === "--slug") slugs.push(process.argv[i + 1]);
    if (process.argv[i] === "--event-id") ids.push(Number(process.argv[i + 1]));
  }
  return slugs.map((slug, i) => ({ slug, eventId: ids[i] }));
}

function main() {
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
    console.error("Need --channel, --name, --watermark (or --from <fetch-output.json>)");
    process.exit(2);
  }

  const type = (arg("--type") as "event" | "general") ?? classifyChannel(name);

  // Loaded before the mapping is built: `--always-read` is sticky, so the skip
  // branch has to see what the channel was already carrying.
  const manifest = loadManifest();
  const prev = manifest.channels[channelId];

  // Build the mapping.
  const kind = arg("--mapping") ?? "none";
  let mapping: Mapping;
  let fingerprint = "";
  if (kind === "event") {
    const evs = collectEvents();
    if (!evs.length || evs.some((e) => !e.slug || !Number.isFinite(e.eventId))) {
      console.error("--mapping event requires at least one --slug + --event-id pair");
      process.exit(2);
    }
    mapping = { kind: "event", events: evs };
    fingerprint = fingerprintForMapping(mapping);
  } else if (kind === "skip") {
    const reason = arg("--reason") ?? "skipped";
    /*
     * `--always-read` keeps a conversation out of the create? pool while still
     * forcing it into the triage on any new content. It exists for the DMs of
     * the people who send work — they feed no page, so `skip` is right, but a
     * skip that hides them is how "please update Carolina Lobos' profile" went
     * unread for a day. Sticky: once set it survives later state writes unless
     * `--no-always-read` clears it.
     */
    const flagged = process.argv.includes("--always-read");
    const cleared = process.argv.includes("--no-always-read");
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

  const next: ChannelState = {
    name,
    type,
    mapping,
    watermarkTs,
    threads: mergedThreads,
    fingerprint: fingerprint || (kind === "event" ? prev?.fingerprint ?? "" : ""),
    lastSyncedAt: nowIso(),
    lastSyncedCommit: arg("--commit") ?? prev?.lastSyncedCommit ?? "",
    ...(digest ? { digest, digestAt } : {}),
  };

  // Avoid timestamp churn: if nothing material changed, keep the prior entry
  // (incl. its lastSyncedAt) so a no-op re-record leaves the manifest byte-stable.
  const material = (c?: ChannelState) =>
    c && JSON.stringify({ n: c.name, t: c.type, m: c.mapping, w: c.watermarkTs, th: c.threads, f: c.fingerprint, d: c.digest ?? "" });
  if (prev && material(prev) === material(next)) {
    process.stdout.write(`no change for ${channelId} (${name})\n`);
    return;
  }
  manifest.channels[channelId] = next;
  saveManifest(manifest);

  process.stdout.write(
    JSON.stringify(
      {
        channel: channelId,
        name,
        type,
        mapping,
        watermarkTs,
        threadCount: Object.keys(next.threads).length,
        fingerprint: next.fingerprint,
        digest: next.digest ?? "",
      },
      null,
      2,
    ) + "\n",
  );
}

main();
