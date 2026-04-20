/**
 * Admin allowlist check.
 *
 * Only users whose Slack user_id appears in SLACK_ALLOWED_USER_IDS
 * (comma-separated) may trigger the bot. Everyone else gets an
 * ephemeral "no permission" message.
 */

import { UnauthorizedUserError } from "./errors";

export function assertAllowed(userId: string): void {
  const raw = process.env.SLACK_ALLOWED_USER_IDS ?? "";
  const allowed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) throw new UnauthorizedUserError(userId);
  if (!allowed.includes(userId)) throw new UnauthorizedUserError(userId);
}
