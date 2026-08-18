# Slack App Development Guide

**Purpose**: This document captures the end-to-end process of building the She Sharp `/event` Slack bot — a Next.js-hosted slash-command app that extracts event-data patches via OpenAI, previews them in an ephemeral Block Kit message, and opens a GitHub PR on confirmation. It records the architectural decisions, the pitfalls encountered during development, and the solutions applied, so future Slack apps built in this repository can skip the same traps.

**Audience**: Claude Code (and human developers) building Slack integrations on top of the She Sharp Next.js codebase on Vercel.

---

## 1. What was built

A Slack slash command `/event <free-form text>` that:

1. Lets an admin describe, in plain English, a change they want to make to the event JSON (`lib/data/json/events-custom.json`).
2. Pulls the channel's recent history + current events JSON + canonical sponsor inventory + image/naming conventions as context.
3. Sends it all to OpenAI with a structured-output request to produce one of three operations:
   - `update` — modify fields of an existing event
   - `create` — add a new event
   - `clarify` — ask the admin a question when intent is ambiguous
4. Writes the patched JSON as a single commit to a `slack-bot-drafts/<id>` Git branch (no PR yet).
5. Sends the admin an ephemeral Block Kit preview with JSON diff, image placement checklist, and Confirm/Cancel buttons.
6. On Confirm: opens a PR from the draft branch to `main`. On Cancel: deletes the draft branch.
7. Admin locally checks out the PR, drops any listed images into `public/img/events/`, pushes, and merges. Vercel auto-deploys.

---

## 2. Architecture

### High-level data flow

```mermaid
sequenceDiagram
    participant Admin as Admin<br/>(Slack)
    participant Slack as Slack<br/>(event channel)
    participant Route as /api/slack/events<br/>(Next.js route)
    participant OpenAI
    participant GitHub as GitHub<br/>(Octokit)
    participant Vercel as Vercel<br/>(prod deploy)

    Admin->>Slack: /event add speaker Danubi Paim...
    Slack->>Route: POST (HMAC-signed)
    Route->>Route: verify signature + allowlist
    Route-->>Slack: 200 ack ("Processing…") <3s
    Note over Route: after(): async work
    Route->>Slack: conversations.history + replies
    Slack-->>Route: channel context
    Route->>OpenAI: structured prompt (context + user text)
    OpenAI-->>Route: EventPatch JSON
    Route->>Route: Zod validate, apply patch
    Route->>GitHub: create draft branch + commit JSON
    GitHub-->>Route: branch URL
    Route->>Slack: ephemeral preview (diff + Confirm/Cancel)
    Slack-->>Admin: show preview

    Admin->>Slack: click Confirm
    Slack->>Route: POST to /interactive (HMAC-signed)
    Route->>Route: verify sig + decode signed payload
    Route->>GitHub: create PR from draft branch
    GitHub-->>Route: PR URL + number
    Route->>Slack: ephemeral "PR opened"
    Slack-->>Admin: show PR link + local instructions

    Admin->>Admin: gh pr checkout N; drop images; git push
    Admin->>GitHub: merge PR
    GitHub->>Vercel: webhook → deploy
    Vercel-->>Admin: site live with new event data
```

### Module boundaries

```mermaid
graph TD
    subgraph Routes[app/api/slack/events/]
        R1[route.ts<br/>slash command + after]
        R2[interactive/route.ts<br/>button handler]
    end

    subgraph Lib[lib/slack-bot/]
        V[verify.ts<br/>HMAC sig check]
        A[allowlist.ts<br/>user permission]
        SC[slack-client.ts<br/>WebClient]
        CF[channel-fetcher.ts<br/>conversations API]
        CV[conventions.ts<br/>rules constants]
        SR[sponsor-registry.ts<br/>slug list]
        AE[ai-extractor.ts<br/>OpenAI + Zod]
        SCH[schema.ts<br/>Zod schemas]
        EM[event-merger.ts<br/>pure patch apply]
        DP[diff-preview.ts<br/>deep-diff]
        BK[block-kit.ts<br/>payloads + HMAC]
        GC[github-client.ts<br/>Octokit]
        DB[draft-branch.ts<br/>branch lifecycle]
        E[errors.ts<br/>typed errors]
        T[types.ts]
    end

    R1 --> V
    R1 --> A
    R1 --> CF
    R1 --> AE
    R1 --> EM
    R1 --> DB
    R1 --> BK
    R1 --> DP
    R1 --> SR
    R1 --> CV
    R1 --> SC

    R2 --> V
    R2 --> BK
    R2 --> DB
    R2 --> SC

    CF --> SC
    AE --> SCH
    AE --> CV
    DB --> GC
    BK -.HMAC sign/verify.-> V
```

### Why this shape

| Decision | Alternative considered | Why this won |
|---|---|---|
| **Single Next.js API route per endpoint with `after()`** | Separate `/process/` route, background worker queue | `after()` from `next/server` handles post-response async work without needing Vercel Background Functions (paid tier) or external queues. Keeps the whole flow in one file. |
| **Git branches as state store for Confirm/Cancel** | Vercel KV, Upstash Redis, in-memory Map | Slack's button `value` is limited to 2000 chars and a full EventPatch can exceed that. Storing the patch as a draft branch lets us pass only a `nanoid(10)` draft ID through the button. No external service to provision. |
| **HMAC-signed button payloads** | Unsigned IDs, opaque session tokens | Button `value` is client-visible; a naïve ID could be tampered with to promote somebody else's draft. HMAC (using the Slack signing secret) costs nothing and prevents replay/swap attacks. |
| **Import `events-custom.json` (not `readFileSync`)** | Read at runtime from lib path | Next.js's webpack traces `import` statements and bundles the file into the lambda. `readFileSync` of a `lib/` path is unreliable on Vercel because the tracer doesn't know the file is needed. |
| **Static sponsor slug list** | Runtime `fs.readdirSync('public/img/sponsors')` | The tracer pulls the entire `public/` tree into the lambda when it sees a dynamic `public/…` fs read, busting the 300 MB function size limit. A hand-maintained list (40 slugs) costs nothing to update. |
| **Per-event image duplication for shared speakers** | `public/img/events/shared/<speaker>.<ext>` with symlinks or alias rules | One rule (`<event-slug>-<descriptive>.<ext>`) with no exceptions is drastically simpler for the AI and for future maintainers. Disk cost is negligible. |
| **Event aliases** (e.g. `iwd-2026` for a 53-char slug) | Force the full slug in filenames | Long slugs produce unusable filenames (`she-sharp-and-academyex-international-womens-day-2026-ana-ivanovic-tongue.jpg`). `EVENT_ALIASES` config in the audit/conventions modules lets us keep short prefixes while enforcing the rule. |
| **Non-strict OpenAI JSON schema + Zod validation** | OpenAI strict mode | Strict mode requires `additionalProperties: false` on every object — incompatible with our `fields` / `event` properties that hold arbitrary EventV3 subsets. Zod on the output is the real safety net. |

---

## 3. Development timeline

The work was split across two milestones (M0 and M1), themselves split into smaller PRs with explicit risk-reduction safeguards. This ordering was deliberate: existing data inconsistencies would have forced the bot's AI rules to handle ambiguity, so cleaning up first paid off twice (simpler rules + cleaner codebase).

```mermaid
gantt
    title She Sharp Slack Bot Development
    dateFormat YYYY-MM-DD

    section M0 Cleanup
    M0-A Audit scripts + CI gate (PR #38)    :done, 2026-04-20, 1d
    M0-B Orphan removal (PR #39)             :done, 2026-04-20, 1d
    M0-C Sponsor logo consolidation (PR #40) :done, 2026-04-20, 1d
    M0-D Legacy image rename (PR #41)        :done, 2026-04-20, 1d

    section M1 Bot
    M1 Full implementation (PR #42)          :done, 2026-04-20, 1d
    Hotfix: readFileSync → import (PR #43)   :done, 2026-04-21, 1d
    Hotfix: lambda size 300MB (PR #44)       :done, 2026-04-21, 1d
    Hotfix: OpenAI strict schema (PR #45)    :done, 2026-04-21, 1d
    Smoke test (Slack /event end-to-end)     :done, 2026-04-21, 1d
```

### M0 — Repository cleanup (prerequisite)

Goal: get image layout + JSON references to a state where a single, clean naming rule can be enforced by the AI.

Risk-reduction framework applied to every cleanup PR:

1. **Dry-run by default** on every mutation script; `--apply` to execute.
2. **Copy-then-delete** (never in-place rename); intermediate state always has both files on disk.
3. **Path integrity CI gate** (`scripts/verify-image-paths.ts`) that asserts every image reference resolves to a real file. Runs on every PR against `main`.
4. **Per-PR visual verification** on Vercel production after merge (PR previews were not configured).
5. **Atomic rollback** via `git revert <sha> && git push`.
6. **Hard scope boundaries**: `public/img/scraped/` (renamed `public/img/legacy-site/` in 2026-08) and unrelated `public/img/*` stayed untouched.
7. **Audit-first sequencing**: M0-A produced the machine-generated rename/delete map; M0-B/C/D executed it without human transcription.

### M1 — Slack Event Bot implementation

After M0 landed and the site was stable, M1 added:
- 2 API routes (`/api/slack/events`, `/api/slack/events/interactive`)
- 13 modules under `lib/slack-bot/`
- 3 new npm deps (`@slack/web-api`, `@octokit/rest`, `deep-diff`)
- 5 new Vercel env vars

Then three hotfixes (PRs #43, #44, #45) addressed issues only visible in production — documented below.

---

## 4. Pitfalls and solutions

Each of the following was discovered during this project. Each is numbered for reference.

### P-1. Existing chaos blocks clean AI rules

**Symptom**: Drafting the AI system prompt surfaced questions like "should sponsor logos live in `/sponsors/` or `/img/sponsors/`? What about `/img/events/iwd-2026-academyex-logo.svg`?" — impossible to answer clearly because the filesystem had all three patterns in use simultaneously.

**Solution**: Split into two milestones. **M0 first** cleans up data; **M1 then** enforces the clean rule. If M0 is skipped, the AI needs complex fallback logic to handle legacy names, and every new event adds more inconsistency on top of the existing chaos.

### P-2. No Vercel PR previews → verify on production

**Symptom**: `/ .github/workflows/deploy.yml` runs Vercel deploy only on push to `main`. PRs don't get preview URLs. Visual verification must happen post-merge.

**Solution**: For risky PRs, merge during a low-traffic window and verify within minutes on the deployed Vercel URL (`https://www.shesharp.org.nz`). Keep `git revert <sha> && git push` as a 30-second rollback. For future work, consider adding a Vercel preview job that runs on PRs.

### P-3. Shared image referenced by multiple events

**Symptom**: `HerWaka-ChanMeng.png` was referenced by two events (`her-waka` and `her-waka-april-2026`). The convention `<event-slug>-<descriptive>.<ext>` can't describe a shared file.

**Solution (chosen)**: Duplicate the file per event (`her-waka-chan-meng.png` + `her-waka-april-2026-chan-meng.png`). Disk cost is trivial; rule stays unconditional. Alternatives considered (sub-directory for shared, alias table) added complexity for no real benefit.

### P-4. Long event slugs produce ugly filenames

**Symptom**: The IWD 2026 event has slug `she-sharp-and-academyex-international-womens-day-2026`. Enforcing `<slug>-<descriptive>.<ext>` would produce 70+-character filenames like `she-sharp-and-academyex-international-womens-day-2026-ana-ivanovic-tongue.jpg`.

**Solution**: Added `EVENT_ALIASES` to the audit script and conventions constants. Event files may use any registered alias as the prefix (IWD uses `iwd-2026`). Both the full slug and the alias are accepted as convention-compliant.

### P-5. `readFileSync` of `lib/` JSON fails in Vercel lambda

**Symptom**: First production invocation: "Unexpected error. Check Vercel logs." After surfacing the real error message, the root cause surfaced as a missing file.

**Cause**: Next.js's webpack traces `import` statements to decide what to bundle into the serverless lambda. `lib/data/json/events-custom.json` was NOT imported — it was `readFileSync`'d at runtime with `path.join(process.cwd(), 'lib/data/json/events-custom.json')`. The file was never bundled; the path didn't resolve on the Vercel filesystem.

**Solution**: Import the JSON directly as a module.

```ts
// BAD — file may not be bundled into the lambda
const text = readFileSync(join(process.cwd(), 'lib/data/json/events-custom.json'), 'utf8');

// GOOD — webpack traces the import and bundles the file
import eventsCustomData from '@/lib/data/json/events-custom.json';
const text = JSON.stringify(eventsCustomData, null, 2);
```

### P-6. `fs.readdirSync('public/…')` busts the 300 MB lambda limit

**Symptom**: `Error: The Vercel Function "api/slack/events" is 318.77mb which exceeds the maximum size limit of 300mb.`

**Cause**: `sponsor-registry.ts` called `fs.readdirSync(path.join(process.cwd(), 'public/img/sponsors'))` at runtime. Next.js's file tracer, seeing a dynamic read under `public/`, conservatively bundles the entire `public/` tree into the lambda — including large videos and the full image library.

**Solution**: Replace the runtime scan with a hand-maintained static list of sponsor slugs. The list lives in `lib/slack-bot/sponsor-registry.ts` and must be updated when a new canonical sponsor SVG is added to `public/img/sponsors/`. Maintenance cost is minimal (sponsor additions are rare and always PR-reviewed).

**Rule of thumb**: Never read from `public/` at runtime in a serverless function unless you're prepared to bundle all of `public/`. Statically import specific files, or use build-time code generation.

### P-7. OpenAI strict JSON schema mode rejects open-shape objects

**Symptom**: `400 Invalid schema for response_format 'EventPatch': In context=('properties', 'fields'), 'additionalProperties' is required to be supplied and to be false.`

**Cause**: `strict: true` on `response_format.json_schema` requires every `type: object` to have `additionalProperties: false` and every property to be in `required`. Our `EventPatch.fields` (for updates) and `EventPatch.event` (for creates) deliberately carry arbitrary EventV3 subsets — their shapes can't be known ahead of time.

**Solution**: `strict: false`. The Zod schema `EventPatchSchema.safeParse(output)` is the real structural safety net; it runs on every model response and rejects any shape that doesn't match the discriminated union. Non-strict mode is still useful — the model follows the schema as a guideline, just without enforcement.

### P-8. Vercel CLI scope mismatch

**Symptom**: `vercel env add` fails because the local CLI is authenticated under the wrong Vercel account/team. `vercel env ls` shows an empty project under `chan-mengs-projects` instead of the real `she-sharp1/she-sharp`.

**Cause**: Vercel CLI uses the current session's scope. The production project is on the `shesharpnz` org (team ID `she-sharp1`), but the local CLI default is the personal account.

**Solution**:

```bash
vercel logout
vercel login            # log in with account that has shesharpnz access
vercel switch she-sharp1   # switch scope to the correct team
rm -rf .vercel && vercel link --yes   # re-link project
```

Verify with `vercel env ls production` — should show existing SheSharp env vars (SLACK_BOT_TOKEN, OPENAI_API_KEY, etc).

### P-9. Slack 3-second ack deadline

**Symptom (would-be)**: Slash commands that take longer than 3 seconds to respond show the user "operation_timeout". Full pipeline (channel fetch + OpenAI + Octokit) takes 15–25s.

**Solution**: Next.js 15's `after()` from `next/server`. Return the 3-second ack immediately; schedule the long work as post-response:

```ts
import { after } from "next/server";

export async function POST(request: Request) {
  // ... signature/allowlist checks ...

  after(() => longRunningWork(params));   // runs after response is sent
  return Response.json({ response_type: 'ephemeral', text: 'Processing…' });
}
```

For the preview itself, `after()`'s handler posts to `params.response_url` (Slack gives us this URL in the slash-command payload — valid for 30 minutes, 5 uses).

### P-10. Generic error messages kill debugging

**Symptom (initial)**: The bot's error handler showed `":warning: Unexpected error. Check Vercel logs."` — but Vercel CLI `vercel logs` is forward-only; it didn't capture the failure that just happened. No way to see what went wrong.

**Solution**: When catching non-`SlackBotError` exceptions, append the actual `error.name: error.message` to the Slack ephemeral:

```ts
} catch (e) {
  const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  const message = e instanceof SlackBotError
    ? e.userMessage
    : `Unexpected error — ${detail}`;
  await respondToSlack(params.responseUrl, buildErrorMessage(message));
  console.error("[slack-bot] processCommand failed:", e);
}
```

Trades a little polish for enormous debugging speedup — essential during development.

### P-11. Without `users:read`, the bot can't look up user IDs

**Symptom**: Adding a new admin to `SLACK_ALLOWED_USER_IDS` requires their Slack user ID (`U0…`). Programmatically looking them up by name or email needs the `users:read` OAuth scope, which wasn't granted.

**Solution (chosen)**: Stay on minimum-scope principle. Admin manually fetches their own user_id via Slack (Profile → More → Copy member ID). Document the steps. For the initial admin, the user can also inspect the `user_id` param in a test `/event` payload.

**Alternative if you need automation later**: Add `users:read` scope (reinstall app), then call `users.lookupByEmail`.

### P-12. Bot must be invited to each channel

**Symptom**: First-time `/event` in a fresh channel fails because the bot isn't a member — `conversations.history` returns "not_in_channel".

**Solution**: Admin runs `/invite @She Sharp Event Bot` in each event channel once. Document this in the setup guide. For private channels (groups), this is the only path — there's no "join all channels" API.

### P-13. Signing Secret + Bot Token rotation

**Non-issue for new apps, but worth knowing**: The old `SLACK_BOT_TOKEN` on Vercel (for the legacy Python script) had different scopes. We REPLACED it with the new token from the new app — `vercel env rm SLACK_BOT_TOKEN production` then `vercel env add`. Old Python script paths that need the legacy token should use a different variable name (`SLACK_LEGACY_BOT_TOKEN` or similar) to avoid conflict.

### P-14. Vercel CLI `printf` vs `echo`

**Rule from CLAUDE.md**: Always use `printf 'value' | vercel env add VAR production`. NEVER `echo`. `echo` appends a trailing `\n` that gets stored as part of the value and silently corrupts the env var.

Example:
```bash
# BAD — value ends up as "xoxb-...\n"
echo "xoxb-..." | vercel env add SLACK_BOT_TOKEN production

# GOOD
printf 'xoxb-...' | vercel env add SLACK_BOT_TOKEN production
```

---

## 5. Slack App setup recipe

When creating a new Slack app in this repository, prefer the manifest route — it's one paste vs. 15+ clicks through the UI.

### Step 1: Create app from manifest

1. Visit https://api.slack.com/apps → **Create New App** → **From a manifest**
2. Pick the target workspace (for She Sharp it's **She#**)
3. Paste the manifest (template below), click Next → Create
4. Slack creates the app in unconfigured state (no OAuth tokens yet)

### Manifest template

```json
{
  "display_information": {
    "name": "Your Bot Name",
    "description": "Short purpose",
    "background_color": "#9b2e83"
  },
  "features": {
    "bot_user": {
      "display_name": "Your Bot Name",
      "always_online": false
    },
    "slash_commands": [
      {
        "command": "/yourcommand",
        "url": "https://www.shesharp.org.nz/api/slack/your-endpoint",
        "description": "What the command does",
        "usage_hint": "<args hint>",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "commands",
        "chat:write",
        "channels:history",
        "channels:read",
        "groups:history",
        "groups:read"
      ]
    }
  },
  "settings": {
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://www.shesharp.org.nz/api/slack/your-endpoint/interactive"
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": false,
    "token_rotation_enabled": false
  }
}
```

Adjust scopes to the minimum your app needs. Avoid `users:read`, `chat:write.public`, or any workspace-wide scope unless you have a concrete use for it.

### Step 2: Install to workspace

1. In the app's left sidebar, click **Install App**
2. Click **Install to [Workspace]**
3. On Slack's OAuth consent screen, click **Allow**
4. Success page shows the **Bot User OAuth Token** (`xoxb-…`). Copy it.
5. Left sidebar → **Basic Information** → scroll to **App Credentials** → click **Show** next to **Signing Secret**. Copy it.

### Step 3: Set Vercel env vars

```bash
vercel switch she-sharp1   # if not already on this scope

printf 'xoxb-your-bot-token' | vercel env add SLACK_BOT_TOKEN production
printf 'your-signing-secret' | vercel env add SLACK_SIGNING_SECRET production
printf 'U0YOURID,U0COLLEAGUE' | vercel env add SLACK_ALLOWED_USER_IDS production

# For apps that commit to GitHub:
printf 'github_pat_xxx' | vercel env add GITHUB_BOT_TOKEN production
printf 'NZ-SheSharp/she-sharp' | vercel env add GITHUB_REPO production
printf 'main' | vercel env add GITHUB_REPO_DEFAULT_BRANCH production
```

### Step 4: Redeploy

Env vars only take effect on new deployments. Either push any commit to `main`, or:

```bash
vercel redeploy <latest-deployment-url>
```

### Step 5: Invite bot + smoke test

In Slack:
```
/invite @Your Bot Name
/yourcommand any test text
```

Expected: 3-second ack, then real response within 30s. If it says `Unexpected error — …`, the error message should tell you the cause (see P-10).

---

## 6. Security conventions

All inbound Slack endpoints in this repository follow the same security checklist:

```mermaid
flowchart TD
    Start([Incoming POST]) --> VS{HMAC<br/>signature<br/>valid?}
    VS -- No --> R401[401 reject]
    VS -- Yes --> VT{Timestamp<br/>within<br/>5 min?}
    VT -- No --> R401
    VT -- Yes --> AL{User in<br/>allowlist?}
    AL -- No --> EPH[Ephemeral:<br/>no permission]
    AL -- Yes --> ACK[200 ack within 3s]
    ACK --> AFTER[after: run pipeline]
    AFTER --> OPENAI[OpenAI call]
    OPENAI --> ZOD{Zod<br/>validates<br/>output?}
    ZOD -- No --> EPHERR[Ephemeral:<br/>invalid patch]
    ZOD -- Yes --> DRAFT[Create draft<br/>branch]
    DRAFT --> PREV[Ephemeral<br/>preview +<br/>HMAC-signed<br/>buttons]
    PREV --> CLICK{Admin<br/>clicks?}
    CLICK -- Confirm --> VERIFY{Button<br/>payload<br/>HMAC<br/>valid?}
    VERIFY -- No --> EPHERR
    VERIFY -- Yes --> PR[Open PR]
    CLICK -- Cancel --> DEL[Delete draft branch]
```

Key invariants:

- **HMAC-SHA256 timing-safe comparison** for every incoming Slack request (`verifySlackSignature`). Reject with 401 on any failure — don't leak "wrong signature vs. wrong timestamp vs. wrong body".
- **Allowlist by user_id**, not by email or name (those can change). Store in `SLACK_ALLOWED_USER_IDS` comma-separated.
- **Button payloads are HMAC-signed** with the Slack signing secret so the button `value` (which is client-visible) can't be tampered with. Verify the signature before acting on the payload.
- **PRs never auto-merge**. Human review is part of the threat model — even if the AI goes off the rails, the worst case is an opened PR that reviewer closes.
- **Zod validate every OpenAI output** before writing to Git. If the model returns something unexpected, fail with a user-visible Zod error message.
- **Error messages to Slack are Slack-safe** (typed `SlackBotError.userMessage`). Don't leak stack traces or internal paths.

---

## 7. Deployment flow

```mermaid
flowchart LR
    subgraph Local[Local development]
        DEV[pnpm dev]
        TC[npx tsc --noEmit]
        VI[npx tsx scripts/<br/>verify-image-paths.ts]
    end

    subgraph Git
        BR[feature branch]
        PR[Pull Request]
        MAIN[main]
    end

    subgraph CI[GitHub Actions]
        V[verify.yml<br/>runs on PR]
        D[deploy.yml<br/>runs on push to main]
    end

    subgraph Prod
        VR[Vercel deploy]
        URL[www.shesharp.org.nz]
    end

    DEV --> TC
    TC --> VI
    VI --> BR
    BR --> PR
    PR --> V
    V --> |pass| MAIN
    MAIN --> D
    D --> VR
    VR --> URL
```

- **Local check**: `npx tsc --noEmit && npx tsx scripts/verify-image-paths.ts` catches 90% of issues before push.
- **CI gate**: `.github/workflows/verify.yml` runs `verify-image-paths.ts` on every PR; failures block merge.
- **Deploy trigger**: `.github/workflows/deploy.yml` on push to `main` runs `vercel deploy --prebuilt --prod`. Takes ~60s.
- **Rollback**: `git revert <sha> && git push` re-triggers deploy within 60s.

---

## 8. Lambda bundle size budget

The Vercel serverless function limit is **300 MB uncompressed**. The `/api/slack/events` route with all dependencies hit 318.77 MB on first try (P-6). Budget considerations for future Slack apps:

| Category | Size guideline |
|---|---|
| `@slack/web-api` + transitive deps | ~25 MB |
| `@octokit/rest` + deps | ~15 MB |
| `openai` SDK | ~10 MB |
| `deep-diff`, `nanoid`, `zod` | <1 MB each |
| Imported JSON files | size of file |
| Imported images / binaries | size of file(s) |
| `fs` reads from `public/` at runtime | **pulls entire `public/`** into bundle (DANGER) |

If you approach the limit:

1. Avoid `fs.readdirSync('public/…')` — use static lists.
2. Import specific JSON files by name, not via dynamic path construction.
3. Consider splitting logic across multiple routes (each gets its own lambda with only the deps it imports).
4. Dynamic imports (`const { x } = await import('y')`) can help for truly conditional deps, but may not reduce bundle size in Next.js — webpack still statically analyses.

---

## 9. Checklist for future Slack apps

When building a new Slack integration in this repo, work through this list in order:

- [ ] **Define the single responsibility** of the new command. One command = one well-scoped operation.
- [ ] **Scope out OAuth scopes**. Start minimal; every scope is a permission you grant the app in the workspace. Common minimum: `commands` + `chat:write`. Add `channels:history`/`groups:history` only if you need to read messages.
- [ ] **Draft the manifest JSON** (template in §5).
- [ ] **Create the app from manifest** in Slack admin; install to workspace; copy bot token + signing secret.
- [ ] **Write the API route**:
  - [ ] `verifySlackSignature` on raw body + headers (reuse `lib/slack-bot/verify.ts`).
  - [ ] Allowlist check (reuse `lib/slack-bot/allowlist.ts`, consider parameterising if a different env var).
  - [ ] Return 3-second ack.
  - [ ] `after(() => longWork(…))` for async processing.
  - [ ] Catch-all handler that surfaces `error.name: error.message` to Slack.
- [ ] **If the command uses OpenAI**:
  - [ ] System prompt with conventions block (if image/file paths involved).
  - [ ] `response_format: { type: 'json_schema', strict: false }` with an explicit schema.
  - [ ] Zod validation on the output.
- [ ] **If the command writes to GitHub**:
  - [ ] Reuse `lib/slack-bot/github-client.ts` for Octokit.
  - [ ] Use the draft-branch pattern (`lib/slack-bot/draft-branch.ts`) instead of opening PRs directly.
  - [ ] HMAC-sign the Confirm button payload (reuse `signPayload`/`verifyPayload` in `block-kit.ts`).
- [ ] **If the command reads files**:
  - [ ] `import` them, don't `readFileSync`.
  - [ ] If scanning a directory, hand-maintain a static list.
- [ ] **Set Vercel env vars** using `printf` (not `echo`). Use the `she-sharp1` scope.
- [ ] **Deploy to production** (push to `main`). Wait for the GitHub Action to finish.
- [ ] **Test endpoints reject unsigned requests** with `curl -X POST` — should return 401.
- [ ] **Invite the bot** to at least one test channel: `/invite @YourBotName`.
- [ ] **Smoke test**: `/yourcommand simple test` in the test channel. Expect 3s ack + real response within 30s.
- [ ] **Document** the new command in `docs/development/` (update this guide or create a sibling).

---

## 10. Reusable modules

The following modules from `lib/slack-bot/` are designed to be reused by future Slack apps in this repo:

| Module | Reusable as-is | Parameterise if |
|---|---|---|
| `verify.ts` | Yes — uses `SLACK_SIGNING_SECRET` from env | You have multiple Slack apps with different secrets |
| `slack-client.ts` | Yes | You need user-token scopes (uncommon) |
| `channel-fetcher.ts` | Yes | You need more/less history |
| `github-client.ts` | Yes | You target a different repo (change env vars only) |
| `draft-branch.ts` | Yes if you're writing files; parameterise the target file path | You're writing multiple files |
| `block-kit.ts` | The HMAC sign/verify functions are reusable; the specific Block Kit builders are event-bot-specific | Copy the HMAC functions, write new builders for your command |
| `errors.ts` | Yes — the base `SlackBotError` class is the pattern | Add your own typed subclasses |
| `allowlist.ts` | Yes | You want a different env var name per app |

Shared infrastructure like `verify-image-paths.ts` and `audit-event-images.ts` (under `scripts/`) is event-specific and probably doesn't generalise to other Slack apps.

---

## 11. Maintenance notes

- **New canonical sponsor logo added**: update `CANONICAL_SPONSOR_SLUGS` in `lib/slack-bot/sponsor-registry.ts` and commit. The AI won't know to reuse it until this list is updated.
- **New admin needs access**: update `SLACK_ALLOWED_USER_IDS` on Vercel:
  ```bash
  printf 'U094QBSBVGD,U0NEW_USER' | vercel env add SLACK_ALLOWED_USER_IDS production --force
  vercel redeploy <latest-url>
  ```
- **OpenAI model change**: update `MODEL` constant in `lib/slack-bot/ai-extractor.ts`. Test with a few `/event` invocations before rolling out widely.
- **Convention change**: edit `lib/slack-bot/conventions.ts`. The change takes effect on next deploy; no schema migration needed since rules are just AI guidance.
- **Draft branch cleanup**: branches are created at preview time and deleted on Cancel or merged on Confirm. Abandoned drafts (admin closes Slack) accumulate. A weekly GitHub Action could sweep `slack-bot-drafts/*` older than N days — not yet implemented.

---

## 12. Outstanding improvements

Deferred from the initial build for scope reasons:

- **Orphaned draft branch sweeper** (weekly GitHub Action for `slack-bot-drafts/*` older than 24h).
- **Slack markdown rendering** of the JSON diff — currently shown in a code block; could be colourised.
- **Image upload via Slack file attachments** — user currently places images manually after PR checkout. A future version could accept images in the `/event` message, upload to Cloudinary, and reference those URLs.
- **Multi-step `clarify` flow** — current `clarify` op just returns a question; a follow-up `/event` starts fresh context. A threaded follow-up would carry context forward.
- **Vercel PR previews** — would let M0-style risky changes be visually verified before merge, rather than after.

These are opportunities for future work rather than known bugs; the current system is complete for the original requirement (admin-driven event data updates).
