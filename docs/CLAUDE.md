# `docs/`

**No proactive documentation.** Do not create a `.md` file unless asked.

When asked, it goes under `docs/{deployment,development,database,features}/` —
**never the repo root**. `docs/ARCHITECTURE.md` is the one deliberate exception:
it is the entry point and stays at `docs/` root.

`docs/README.md` is the index and claims "Nothing here is orphaned" — **adding a
doc means adding its row there**, with an honest status column (`current`,
`historical record`, `dormant`). `docs/showcase/` is not prose but the images
the root `README.md` embeds between its `SHOWCASE:START` markers; do not
hand-edit that README block — edit the scenario and re-run the capture script.
`docs/marketing/` holds dated campaign artifacts.

Write in British spelling, in English, and explain **why** — the rules in these
files exist because the code alone did not say. State the dated incident that
produced a rule; a rule with no consequence attached is the first one somebody
deletes.

`docs/` is a scan root for `scripts/verify-image-paths.ts`, so an image path
written into a doc is a live reference and a typo fails CI.
