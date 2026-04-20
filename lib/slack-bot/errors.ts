/**
 * Typed errors for Slack-bot flow control.
 *
 * All errors carry a `userMessage` — a short, Slack-safe string that can
 * be shown to the admin without leaking internal detail.
 */

export class SlackBotError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
  ) {
    super(message);
    this.name = "SlackBotError";
  }
}

export class InvalidSignatureError extends SlackBotError {
  constructor() {
    super(
      "Slack request signature verification failed",
      "Request signature invalid. This endpoint only accepts signed Slack requests.",
    );
    this.name = "InvalidSignatureError";
  }
}

export class UnauthorizedUserError extends SlackBotError {
  constructor(userId: string) {
    super(
      `User ${userId} is not in SLACK_ALLOWED_USER_IDS`,
      "You don't have permission to use this bot. Ask an admin to add your Slack user ID to the allowlist.",
    );
    this.name = "UnauthorizedUserError";
  }
}

export class InvalidPatchError extends SlackBotError {
  constructor(detail: string) {
    super(
      `AI produced an invalid EventPatch: ${detail}`,
      "The AI's extraction output didn't match the expected shape. Please try rephrasing or contact an admin.",
    );
    this.name = "InvalidPatchError";
  }
}

export class GitHubError extends SlackBotError {
  constructor(detail: string) {
    super(
      `GitHub API failed: ${detail}`,
      "Could not create the pull request. Check GITHUB_BOT_TOKEN and repository permissions.",
    );
    this.name = "GitHubError";
  }
}
