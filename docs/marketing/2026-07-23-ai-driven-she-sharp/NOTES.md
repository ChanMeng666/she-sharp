# LinkedIn post — She Sharp AI-Driven (2026-07-23)

## Files
- `post.txt` — copy-paste ready LinkedIn body (plain text, no markdown)
- `visual.html` — She Sharp editorial square (1080×1080): no emoji; Lucide-style SVG icons; `(01)` labels; 32px cards; spectrum hairline
- `visual.png` — rendered asset matching site design system (Bricolage + Instrument + Carattere; white canvas; brand purple punctuation)

## Brand tokens used
From `emails/brand.ts` / site design system:
- Purple dark `#9b2e83`, periwinkle `#8982ff`, mint `#b1f6e9`, navy `#1f1e44`, page bg `#f9f5f8`
- Fonts: Bricolage Grotesque (display) + Instrument Sans (body)
- Logo: `public/logos/she-sharp-logo-purple-dark-500x500.png`

## Highlights covered in the post
1. **Live chatbot** — `lib/chatbot/`, `docs/development/CHATBOT_AI_AGENT.md`
2. **People ops AI** — mentor matching (`lib/matching/`) + volunteer AI screening (`lib/recruitment/ai-screening.ts`)
3. **Slack AI apps** — Event Bot (`lib/slack-bot/`, `/event`) · screening/newsletter webhooks (`lib/slack/service.ts`) · weekly funding digest with AI scoring (`lib/funding/`, `lib/slack/funding-digest-service.ts`)
4. **Custom agent skills** — `.claude/skills/sync-event-from-slack/` · `.claude/skills/monthly-newsletter/`
5. **Close** — Aotearoa AI Hackathon 2026 Voice AI Agent

## Links in the post
- https://www.shesharp.org.nz
- https://hackathon.shesharp.org.nz
- https://aihackathon.nz

## Publish checklist
1. Open LinkedIn → Start a post (feed may already be open)
2. Paste — `post.txt` was also copied to the system clipboard; Ctrl+V into the composer
3. Attach image (manual — LinkedIn’s native file picker is not automated):
   `d:\github_repository\she-sharp\docs\marketing\2026-07-23-ai-driven-she-sharp\visual.png`
4. Optionally @mention She Sharp’s company page / hackathon partners if desired
5. Review preview → Post (do this yourself — agent never auto-publishes)

## LinkedIn composer note
Browser automation MCP / claude-in-chrome may be unavailable in Cursor; clipboard + opened feed + file paths are the handoff.

## Re-render visual
From the linkedin-post skill directory:

```bash
node scripts/render-html.mjs \
  "d:/github_repository/she-sharp/docs/marketing/2026-07-23-ai-driven-she-sharp/visual.html" \
  "d:/github_repository/she-sharp/docs/marketing/2026-07-23-ai-driven-she-sharp/visual.png" \
  --selector ".stage" --width 1200 --height 1200
```
