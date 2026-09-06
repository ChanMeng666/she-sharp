# The GitHub account: plan, Actions budget, and what must not be deleted

Three facts that bind before you touch `.github/workflows/`, and one DNS record
whose deletion would quietly undo a verification.

Measured 2026-09-01 across 300 runs from 2026-08-13.

---

> ## ⚠️ Superseded on 2026-09-06 — the repository is now PUBLIC
>
> Everything below was written while `she-sharp` was a **private** repository on
> the **GitHub Free** plan, and that premise is what has changed. As at
> 2026-09-06:
>
> - **Actions minutes are free and unmetered.** The 2,000-minute allowance, the
>   meter, and the risk of running out no longer apply to this repository. Public
>   repositories on standard runners are not billed at all.
> - **Branch protection is available and is now on.** A ruleset on `main`
>   requires a pull request and a passing **`verify`** check, and forbids
>   force-push and deletion. **The job name `verify` is therefore load-bearing** —
>   renaming it silently removes the gate, because the ruleset matches by name.
>   That is the exact opposite of what this document said, and it is the one line
>   here most likely to hurt someone.
> - **Secret scanning, push protection and Dependabot are enabled.** They were
>   impossible before; a push containing a credential is now rejected outright.
>
> The per-job billing rule below is **kept as the reason `verify.yml` is a single
> job**, not as a live constraint. Keep the single job: it is still faster and one
> install cannot drift from another. Why the repository was made public, and the
> credential audit that had to happen first, are in
> `MAINTAINER_HANDOVER.md` §12.

## Every Actions minute here was billed (until 2026-09-06)

`NZ-SheSharp` is on the **GitHub Free** plan and `she-sharp` **was** a private
repository. Those two together were the whole story: Actions on a *public* repo
with standard runners is free and unmetered, so most advice you will read
online did not apply. The org gets **2,000 minutes a month** and, while this
repository was private, the meter was real.

**Running out disables every workflow, `Deploy to Vercel` included.** There is
no partial degradation and no queue — the site simply stops being deployable
until the allowance resets. This still applies to any *other* private repository
in the org.

The plan also explained two things that looked like bugs at the time:

- **Branch protection was unavailable.** `repos/…/branches/main/protection`
  returned `403 Upgrade to GitHub Pro or make this repository public`. **No
  longer true** — see the banner above.
- The billing page's Actions meter existed at all. A public repo would not have
  one, and this repository no longer contributes to it.

## Actions bills each JOB, rounded up to the whole minute

This is the rule that governs how workflows here are shaped, and it is not
intuitive, because **wall clock is not what is billed**.

Five parallel 40-second jobs cost **five minutes**, not forty seconds. The run
looks fast — that is the trap.

`verify.yml` was exactly that mistake until 2026-09-01: five jobs, each
re-paying the same ~21s of checkout + pnpm + Node + install, so **147s of real
checking sat behind 105s of duplicated setup and billed 8 minutes.** Merged into
one job it bills 3–4. `Verify` alone had been 66% of the org's entire Actions
spend.

**So: a new offline check is a STEP in the existing `verify` job, never a new
job.** `docs/development/TESTING.md` owns that rule and explains the
`if: ${{ !cancelled() && … }}` guard that keeps one red check from hiding the
next. This file explains what it costs.

## What each workflow actually costs

Measured, not estimated. Before the 2026-09-01 rework (PR #257):

| Workflow | runs / 19 days | jobs | billed min | share |
|---|---:|---:|---:|---:|
| `Verify` | 159 | 795 | **1,079** | 66.4% |
| `Deploy to Vercel` | 137 | 137 | 540 | 33.2% |
| `Slack triage` | 4 | 4 | 7 | 0.4% |

After, per run:

| Workflow | measured | billed | note |
|---|---|---|---|
| `Verify` | 148–186s, mean 173s | **mean 3.4 min** | straddles the 180s boundary — do not quote a flat 3 |
| `Deploy to Vercel` | 211–221s | **4 min** | see below; it does not get to 3 |
| `Slack triage` | ~68s | 2 min | 5 scheduled runs a week |

Roughly **2,600 → 1,650 minutes a month**, i.e. from 130% of the allowance to
about 83%. The whole saving is `Verify`.

### The deploy job does not get under 180s, and trying was a mistake

Worth writing down because the reasoning looked sound and was wrong.

`deploy.yml` lost 40 seconds of genuine waste on 2026-09-01: a `.next/cache`
step that its own comment had already measured as restoring ~180 KB that cannot
speed up a Turbopack build (3s to restore, 15s to upload, every run), and an
uncached `npm install -g vercel@latest` re-downloading the CLI for 22s a run.
The CLI cache works — `Install Vercel CLI` goes **22s → 0s** on a hit.

The job still bills **4 minutes**, because `vercel deploy` itself swings 48–77s
and the total sits at 211–221s, nowhere near 180s. Four consecutive runs after
the change: 211s, 221s, 213s, 220s — all 4 minutes.

**Shaving seconds saves nothing unless it crosses a minute boundary.** Predict
that crossing and you will be wrong; measure the job afterwards.

What *does* save deploy minutes is the `concurrency` group with
`cancel-in-progress`, added at the same time: 20% of deploys (28 of 137) were
still running when a later push arrived, and one burst on 2026-08-30 ran **eight
full production builds inside sixty seconds**.

The remaining lever, not taken: `vercel build` runs on the GitHub runner
(100–107s) and `vercel deploy --prebuilt` uploads the result. Letting Vercel
build on its own infrastructure instead would take this job to near zero Actions
minutes, at the cost of the `next/font/google` retry loop and of build failures
no longer turning the Action red. That was considered and deliberately declined
on 2026-09-01; revisit it only if the allowance gets tight again.

### How to re-measure

**`GET /actions/runs/<id>/timing` returns all zeros on this account.** Do not
trust it. Compute from the jobs API instead, rounding each job up:

```bash
gh api "repos/NZ-SheSharp/she-sharp/actions/runs/<id>/jobs" \
  --jq '.jobs[] | [.name, ((.completed_at|fromdate)-(.started_at|fromdate))] | @tsv'
```

And before blaming a workflow for a spike, measure it. `Slack triage` was
suspected of causing the 2026-08 spike and was **0.4%** of spend; the spike was a
two-day PR burst on 29–30 August that cost 852 minutes, 43% of a month. The
billing page lags, so the newest workflow takes the blame.

---

## `shesharp.org.nz` is a verified GitHub domain — do not delete the TXT record

Verified on the org 2026-09-01. There is now a record in Cloudflare
(`shesharp.org.nz` zone) that exists solely to hold that verification:

```
TXT   _gh-NZ-SheSharp-o   d1a4c64948   TTL Auto
```

**Leave it in place.** GitHub re-checks periodically; deleting it drops the
domain's Verified status, and the GitHub for Nonprofits flow treats domain
control as a prerequisite. It is namespaced under `_gh-` and affects nothing
else — not Google Workspace mail, not the Vercel CNAMEs, not the Mailchimp DKIM
records. `docs/deployment/EMAIL_AUTHENTICATION.md` inventories the *email* DNS;
this record is not part of that and has no bearing on deliverability.

Two notes for anyone repeating a domain verification:

- Read GitHub's hostname and code out of the DOM (`input[readonly].value`), not
  off the screen. Both render truncated in their boxes: `_gh-NZ-SheSharp-o`
  looks like a cut-off string and is the whole value.
- The page warns propagation "could take up to 72 hours". Cloudflare was
  instant — public DoH resolved the record on the first query — so click
  **Verify** straight away rather than waiting.

## GitHub for Nonprofits — applied 2026-09-01, awaiting review

Submitted at https://nonprofits.github.com for `NZ-SheSharp`; status
**Applied**, decision by email in typically 3–7 business days.

If approved the org gets a **free GitHub Team plan**: 3,000 Actions minutes a
month instead of 2,000 (which would put current usage at ~55%), 2 GB artifact
storage instead of 500 MB, and branch protection on private repositories.

The charity's own paperwork — registered name, number, the proof-of-status PDF
that was attached — lives in the private archive repo under `governance/`, not
here. See `governance/README.md` there.

Three things that cost time and would cost it again:

- **The org dropdown stays empty unless the org-access grant lands before the
  authorize.** Clicking `Grant` on the OAuth consent screen submits the
  authorization instead, and the portal then never sees the org — a re-login and
  "Select New GitHub Organization" both fail to fix it. GitHub's documented
  remedy is the one that works: revoke the app at
  `/settings/connections/applications/…`, sign out of the portal, and start
  again.
- Granting an org access to an OAuth app requires a **passkey**. A person has to
  be at the keyboard for that step.
- She Sharp is **not** in GitHub's pre-validated nonprofit database — searching
  it by name and by `CC57025` both return nothing — so the manual application
  path with a document upload is the only one available.

**One commitment in that application binds afterwards.** Microsoft's nonprofit
eligibility rules, which GitHub rides, restrict who may *hold* a granted licence
to **staff and volunteers**. Beneficiaries, members, donors and event attendees
may not. The mission of serving women in tech is not the problem; giving a
community member a GitHub Team seat would be. Seats stay with the website and
operations volunteers.
