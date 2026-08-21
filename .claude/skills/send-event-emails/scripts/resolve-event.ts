/**
 * Resolves a slug or a half-remembered event name to one event record.
 *
 * The implementation moved to `scripts/events/resolve-event.ts` because the
 * event-announcement spec generator needs exactly the same resolution, and a
 * second copy of it is how a date drifts by a day between an email and a
 * poster. Everything — the fuzzy matching, the local-calendar dates, the
 * NZDT/NZST derivation, the exit codes — lives there now.
 *
 * This path stays because `send-event-emails/SKILL.md` quotes it verbatim in
 * Step 1 and every organiser has that command in muscle memory. It must behave
 * identically: same stdout, same exit codes (0 resolved, 1 no match, 2
 * ambiguous). Run it exactly as before:
 *
 *   npx tsx .claude/skills/send-event-emails/scripts/resolve-event.ts <slug-or-fuzzy-name> [--json]
 *   npx tsx .claude/skills/send-event-emails/scripts/resolve-event.ts --list [--limit 12] [--json]
 */

import { runCli } from "@/scripts/events/resolve-event";

export * from "@/scripts/events/resolve-event";

runCli();
