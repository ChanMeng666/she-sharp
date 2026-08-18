/**
 * Guard rails for the two scripts that irreversibly wipe the database.
 *
 * Both `clear-all-data.ts` and `reset-db-and-create-admin.ts` used to run the
 * moment they were invoked: no dry run, no confirmation, no check of which
 * database they were pointed at. `lib/db/drizzle.ts` reads `POSTGRES_URL`
 * through `dotenv.config()`, so on a machine that has ever run
 * `vercel env pull` the default target is production. A mistyped `npx tsx`
 * argument, a stale terminal, or an agent following a runbook literally was
 * enough to truncate ~30 live tables.
 *
 * The contract these helpers impose:
 *
 *   1. Dry run is the default. `--apply` is the only way to write.
 *   2. The target host is always printed, before anything happens.
 *   3. Against a non-local host, `--apply` alone is refused. The caller must
 *      also pass `--confirm-host=<host>` naming the exact host, so wiping
 *      production takes a deliberate copy-paste rather than an up-arrow.
 *
 * Rule 3 is the one that matters. Reading a warning banner is passive and
 * scrolls past; retyping the hostname is an act.
 */

/** Hosts that are unambiguously a developer's own machine. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0", "host.docker.internal"]);

export type DestructiveTarget = {
  /** Hostname from POSTGRES_URL, e.g. "ep-foo-123-pooler.ap-southeast-1.aws.neon.tech". */
  host: string;
  /** Database name from the URL path, e.g. "neondb". */
  database: string;
  /** True when the host is loopback — the only case `--apply` works unaided. */
  isLocal: boolean;
  /** True when `--apply` was passed. Absent means dry run. */
  apply: boolean;
};

/**
 * Parses the connection target without exposing credentials.
 *
 * Returns only host and database; the password never leaves this function,
 * because these scripts print their target and the output ends up in logs and
 * in agent transcripts.
 */
export function readTarget(argv: string[] = process.argv.slice(2)): DestructiveTarget {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("POSTGRES_URL is not set — refusing to run a destructive script blind.");
  }

  let host: string;
  let database: string;
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    database = parsed.pathname.replace(/^\//, "") || "(default)";
  } catch {
    throw new Error("POSTGRES_URL is not a parseable URL — refusing to run a destructive script blind.");
  }

  return {
    host,
    database,
    isLocal: LOCAL_HOSTS.has(host),
    apply: argv.includes("--apply"),
  };
}

/**
 * Prints the target and decides whether the caller may proceed to write.
 *
 * Returns true only when every gate passes. Callers must treat a false return
 * as "stop here" — it has already explained why to the user.
 *
 * @param action Short description of the irreversible operation, used in the
 *   messages, e.g. "truncate all tables".
 */
export function authorizeDestructive(action: string, argv: string[] = process.argv.slice(2)): boolean {
  const target = readTarget(argv);

  console.log("");
  console.log(`  Target host : ${target.host}${target.isLocal ? "  (local)" : ""}`);
  console.log(`  Database    : ${target.database}`);
  console.log(`  Action      : ${action}`);
  console.log(`  Mode        : ${target.apply ? "APPLY — this will write" : "dry run"}`);
  console.log("");

  if (!target.apply) {
    console.log("Dry run. Nothing was changed.");
    console.log(`Re-run with --apply to ${action}.`);
    if (!target.isLocal) {
      console.log(`Because ${target.host} is not a local host, you will also need`);
      console.log(`  --confirm-host=${target.host}`);
    }
    return false;
  }

  if (target.isLocal) return true;

  const confirmed = argv.find((a) => a.startsWith("--confirm-host="))?.slice("--confirm-host=".length);
  if (confirmed !== target.host) {
    console.error(`REFUSED. ${target.host} is not a local database.`);
    console.error("");
    console.error("This looks like a hosted database, quite possibly production.");
    console.error("To proceed, name the host explicitly:");
    console.error(`  --apply --confirm-host=${target.host}`);
    if (confirmed) console.error(`(you passed --confirm-host=${confirmed}, which does not match)`);
    return false;
  }

  console.log(`Host confirmed. Proceeding to ${action}.`);
  return true;
}
