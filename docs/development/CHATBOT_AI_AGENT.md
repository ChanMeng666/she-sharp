# AI Chatbot Assistant — Architecture & Operations

The right-bottom visitor chatbot is a **knowledge-grounded AI agent** built on the
**Vercel AI SDK 6** `ToolLoopAgent`. It answers questions about events, the
mentorship programme, the team, mentors, sponsors, donations and volunteering,
and guides visitors with clickable in-site links. It reads **live data modules**
on every request, so newly added events appear automatically with **zero manual
maintenance**.

Shipped to production 2026-06-23 (commits `feccddb` → `7bdbdd0` → `a067824` →
`81d2320`).

## How it works (hybrid: compact context + tools)

1. **Always-on knowledge context** — `lib/chatbot/knowledge.ts`
   `buildKnowledgeContext()` is rebuilt per request from live data: org facts +
   founder/chair (derived from team data), `globalStats`, mentorship policy with
   **live paused/open status** (`isMentorshipOpen()`), the next 5 upcoming events
   (`getUpcomingEvents()`), and get-involved entry links. ~1.5–2k tokens. Covers
   high-frequency questions with no tool call.
2. **Tools (on-demand, for long-tail/growing data)** — `lib/chatbot/tools.ts`:
   - `findEvents({query?, city?, timeframe?, limit?})` — token-scored search over
     a haystack that includes sponsor names/city/category (so "MYOB Tech That
     Matches" matches an event sponsored by MYOB). Defaults `timeframe` to `all`
     when a `query` is given (past events are findable), else `upcoming`.
   - `getEventDetails({slug})` — date, time, venue, speakers, registration &
     gallery links.
   - `getMentors({industry?, expertise?, limit?})` — mentor directory lookup.
   - `getTeamMembers({name?, role?, limit?})` — team lookup.
   All tools wrap the existing `lib/data/*` helpers and return compact JSON
   (lists capped at 8).
3. **Agent** — `lib/chatbot/agent.ts` `createSheSharpAgent()` builds a
   `ToolLoopAgent({ model, instructions, tools, stopWhen: stepCountIs(5),
   temperature: 0.5, maxOutputTokens: 900 })`. Instructions = persona + guardrails
   (always link in-site; answer only from context/tools, never invent events/
   mentors/policies; mentorship-paused rule; British/NZ English) + the live
   knowledge context.
4. **Route** — `app/api/chat/route.ts`: `export const maxDuration = 60`; per-IP
   rate limit → non-blocking analytics via `after()` → streams via
   `createAgentUIStreamResponse({ agent, uiMessages: messages })`.
5. **Front-end** — `components/chatbot/chatbot.tsx` uses AI SDK 6 `useChat`
   (`@ai-sdk/react`, `DefaultChatTransport`): input managed with `useState` +
   `sendMessage({text})`; loading = `status` is `submitted`/`streaming`; messages
   render from `message.parts` (flattened by `messageText`); history persisted to
   `localStorage` as `UIMessage[]`. `chat-message.tsx` takes a plain `content`
   string (parent flattens parts). `preset-questions.ts` powers the Quick
   Questions tab (kept in sync re: stats and mentorship-paused wording).

## Model (IMPORTANT — direct OpenAI, not the Gateway)

`getChatModel()` in `lib/chatbot/agent.ts`:
- **Default: direct `openai('gpt-4o-mini')`** using the project's existing
  `OPENAI_API_KEY`. This is the production path — reliable, zero markup.
- Opt-in to **Vercel AI Gateway** only if `AI_GATEWAY_API_KEY` is set **or**
  `CHATBOT_USE_GATEWAY=1`.

**Why not the AI Gateway (decision 2026-06-23):** the Gateway's free tier is
rate-limited per model (`GatewayRateLimitError` 429 under load), and **BYOK
(bring-your-own OpenAI key) is itself gated behind purchased AI Gateway credits**
— the Pro plan's $20/mo credit does NOT count as AI Gateway credits. Even with
BYOK, if the purchased credit balance hits zero the Gateway blocks all requests.
For a non-profit, direct OpenAI (already zero-markup) is the pragmatic choice. The
`CHATBOT_USE_GATEWAY=1` flag stays dormant so the team can switch to the Gateway
later (for observability/fallback) by buying credits and setting the env — no code
change needed.

## Rate limiting & analytics (Upstash Redis)

- `lib/chatbot/redis.ts` `getChatRedis()` — shared client; resolves creds from
  any of `UPSTASH_REDIS_URL/TOKEN`, `UPSTASH_REDIS_REST_URL/TOKEN`, or
  `KV_REST_API_URL/TOKEN`. Returns `null` (graceful degrade) if unconfigured.
- `lib/chatbot/rate-limit.ts` — `@upstash/ratelimit` sliding window **15 req /
  60 s** per IP; on error/unconfigured it allows the request (never breaks chat).
- `lib/chatbot/analytics.ts` — logs each question via `after()` into Redis:
  sorted set `chatbot:questions` (frequency) + capped list `chatbot:recent`. Use
  these keys to see what visitors ask. No DB migration.
- Provisioned via Vercel Marketplace ("upstash-kv-cerise-leaf", Free tier, iad1),
  connected to Production/Preview/Dev. Verified active in prod (concurrent burst
  returns 429s after the window fills).

## Deployment notes (read before changing deps or deploying)

- **No Vercel Git connection** — production deploys are **prebuilt bundles via
  GitHub Actions on push to `main`**. The dashboard "Redeploy" of a prebuilt
  deployment is blocked and won't pick up new env vars; to apply new env vars,
  **push a commit** (CI re-pulls env and rebuilds).
- **pnpm lockfile**: local pnpm is 11.x but Vercel builds with **pnpm 10.x +
  frozen-lockfile**. `pnpm@11 install` drops the `overrides:` section →
  `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` on deploy. After any dependency change,
  regenerate with `CI=true npx pnpm@10 install --lockfile-only`, then verify
  `grep '^overrides:' pnpm-lock.yaml` and that `npx pnpm@10 install
  --frozen-lockfile` passes.
- **Local build**: `CI=true npx next build` (the `pnpm build` script trips pnpm
  11's pre-run deps check on ignored build scripts).
- **AI SDK 6 requires zod ≥ 3.25** (for the `zod/v4` subpath). v6 API names:
  `tool({ inputSchema, execute })`, `stepCountIs`, `convertToModelMessages`,
  `createAgentUIStreamResponse`, `ToolLoopAgent({ maxOutputTokens })`.

## Verifying after changes

```bash
CI=true npx next build                 # types/compile
# local run: pnpm dev, open chat at bottom-right, or curl the route:
curl -s -N -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"What events are coming up?"}]}]}'
```
Check: upcoming events with `/events/{slug}` links; event details; team/founder;
"can I apply for mentorship?" → states applications paused + `/mentorship` link;
sponsors/donate/volunteer links; off-topic guardrail.

## Environment variables

- `OPENAI_API_KEY` — required (chatbot model + mentor matching). Already set in prod.
- `UPSTASH_REDIS_URL`/`TOKEN` or `KV_REST_API_URL`/`TOKEN` — optional (rate limit +
  analytics). Set in prod via the Upstash Marketplace integration.
- `CHATBOT_USE_GATEWAY=1` / `AI_GATEWAY_API_KEY` — optional; only set if the team
  has purchased Vercel AI Gateway credits and wants to route via the Gateway.
