# Documentation index

Every file under `docs/`, with one line each. Nothing here is orphaned.

`CLAUDE.md` in the repo root is where to **start** — the curated index, carrying
the rules that bind you everywhere. It links about 28 of these files, the ones
with rules in them; this file is the complete map, so the rest are findable too.
**`ARCHITECTURE.md`** here is the entry point for how a request travels through
the repo and where each `lib/` subsystem lives — route groups, auth gates,
rendering strategy. Current. Status columns below are honest: **current**
describes the code today, **historical record** documents a change that already
happened, **dormant** is a runbook for a state the site is not in.

## `database/`

| Doc | What it is | Status |
|---|---|---|
| `DATABASE_SCHEMA.md` | Table-by-table and enum-by-enum reference | counts corrected 2026-08-19 (37/32); table detail still dated 2025-12-15 and may lag |
| `MENTOR_MENTEE_DATA_GUIDE.md` | Field-by-field map of the dual-table `form_submissions → profiles → users` chain | current |

## `deployment/`

| Doc | What it is | Status |
|---|---|---|
| `EMAIL_AUTHENTICATION.md` | SPF/DKIM/DMARC records, the staged move to enforcement, Mailchimp → Resend runbook | current |
| `WORKSPACE_MAILBOX_CHECKLIST.md` | The Google Workspace side of the 2026-08 mailbox audit — bilingual, for the super-admin | current |
| `MAINTENANCE_MODE.md` | `MAINTENANCE_MODE=true` → branded 503 for the whole site | current |
| `VERCEL_ENV_VARIABLES_GUIDE.md` | Setting env vars without silently corrupting them | current |
| `DOMAIN_MIGRATION_2026-06-19.md` | The cutover to `www.shesharp.org.nz`, layer by layer | historical record |
| `MIGRATION_TO_SHESHARP_ORG.md` | The 2026-03-24 move to the org GitHub + Vercel accounts | historical record |

## `development/`

| Doc | What it is | Status |
|---|---|---|
| `ADD_EVENTS.md` | Editing events, stats, sponsors, podcasts and press in `lib/data/` | current |
| `AI_SKILLS_GUIDE.md` | Non-technical walkthrough: installing Cursor and the tools, running any of the eleven `.claude/skills/` workflows, and getting your work back into the repo | current |
| `EVENT_PLAYBOOK.md` | The one-page version for the whole team — one diagram, one section per team, a copy-paste prompt for every job. **This is what `/internal/event-playbook` serves** | current |
| `CHATBOT_AI_AGENT.md` | The visitor chatbot: knowledge context, tools, rate limiting | current |
| `CONTENT_RULES.md` | Counting and naming traps; read before publishing a number or a name | current |
| `DECK_SYSTEM.md` | The `/present/*` deck system in full — data model, skins, linter, host controls | current |
| `EMAIL_ADDRESSES.md` | Every `@shesharp.org.nz` address, and which are mailboxes vs sending identities | current |
| `EMAIL_OPERATIONS.md` | The four sending streams, unsubscribe handling, newsletter loop | current |
| `EVENT_FEEDBACK.md` | The `/f/<code>` QR form: codes, rate limiting, digest, anonymisation | current |
| `EVENT_LIFECYCLE_SOP.md` | One regular event end to end for the whole team — the partner conversation, the phase order, who does what, the promotion beats, close-out, and the developer machinery underneath. The reference `EVENT_PLAYBOOK.md` is built from | current |
| `FUNDER_REPORTS.md` | Why `report/` is a separate Typst project and what gates a final build | current |
| `GEO_SEO_MONITORING.md` | What SEO/GEO surfaces exist, the Search Console properties, the baseline | current |
| `GEO_SEO_IMPLEMENTATION_GUIDE.md` | Reusable playbook for adding SEO/GEO to a Next.js 15 site | current |
| `GEO_SEO_BACKLOG.md` | Prioritised SEO/GEO follow-ups, ten done and six open | current, live worklist |
| `HUMANITIX_ARCHIVE.md` | The ticketing export: three tiers, and seven ways a number from it goes wrong | current |
| `MAILCHIMP_ARCHIVE.md` | The `She#` audience export: 1,560 subscribed of 3,689, and the suppression register | current |
| `MENTORSHIP_APPLICATIONS_PAUSED.md` | What was hidden on 2026-06-19 and the runbook to re-open | current — the pause is live |
| `PHOTOGRAPHING_MINORS.md` | When a photograph of a child may be published, and the ten already published without a rule | current — two items await She Sharp's decision |
| `PUBLIC_CLAIMS_PROVENANCE.md` | Which published figures have a record behind them and which do not | current |
| `SITE_DATA_HISTORY.md` | Why pre-2023 event data is patchy — background, not rules | current |
| `SLACK_INTEGRATION_GUIDE.md` | Setting up incoming webhooks and the notification code pattern | current |
| `SLACK_EVENT_EXTRACTION.md` | The `/event` slash command workflow, with the Python scraper as fallback | current |
| `SLACK_APP_DEVELOPMENT_GUIDE.md` | Building a Slack app on this codebase — decisions and traps | current |
| `QA_REPORT_FIXES.md` | Item-by-item response to the April 2026 external QA sweep | historical record |
| `batch-import-mentors-2026.md` | The 2026-03-19 one-off import of 25 pre-approved mentors | historical record |

## `features/`

| Doc | What it is | Status |
|---|---|---|
| `AI_MATCHING_SYSTEM.md` | How GPT scores mentor/mentee compatibility, with the queue and admin review | current |
| `QR_CODE_GENERATION.md` | The two QR paths — `/api/qr` + print script, and the separate deck codes | current |
| `TEST_USER_ISOLATION.md` | `is_test_user`, test invitation codes, analytics exclusion, cleanup script | current — **authoritative** for this subject |
| `RESTORE_MENTEE_PAYMENT.md` | How to put the $100 mentee Stripe step back; disabled March 2026 | dormant runbook |

## `superpowers/`

Three March 2026 planning documents written for an agent to execute. The work
**shipped** — `ensureUserVerified()`, `maskEmail()` and the `isTestUser` queue
filters are all in the code — but the checkboxes were never ticked, so the files
read as open plans. Design records, not TODOs.

| Doc | What it is | Status |
|---|---|---|
| `specs/2026-03-31-auth-edge-cases-optimization-design.md` | Design for seven auth edge cases found after a dual-account incident | historical record |
| `plans/2026-03-31-auth-edge-cases-optimization.md` | The task-by-task plan for that design | historical record, shipped |
| `plans/2026-03-29-test-user-isolation-completeness.md` | Plan to extend test-user badges and filters across admin views | historical record, shipped — superseded by `features/TEST_USER_ISOLATION.md` |

## `marketing/`

Dated campaign artifacts, not engineering documentation. `2026-07-23-ai-driven-she-sharp/`
holds one LinkedIn post: `NOTES.md` (what was made and how), `post.txt` (the copy),
`visual.html` and `visual.png` (the 1080×1080 square).

## `showcase/`

**Not prose — 13 MB of binaries.** The images and video the root `README.md`
embeds between its `SHOWCASE:START` markers: `hero.webp`, `events-full.webp`,
`mentorship.webp`, `mobile-home.webp`, `demo.gif`, `demo.mp4`, plus
`showcase.scenario.json`, the capture script that regenerates them. Do not delete
them, and do not hand-edit the README block — edit the scenario and re-run.

## Adding a doc

From `CLAUDE.md`: **no proactive documentation** — do not create `.md` files
unless asked. When asked, they go under
`docs/{deployment,development,database,features}/`, never the repo root.
`ARCHITECTURE.md` is the one deliberate exception and stays at `docs/` root.
