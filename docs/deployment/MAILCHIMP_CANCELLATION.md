# Cancelling the Mailchimp subscription / 取消 Mailchimp 付费订阅

**The correction this document exists for.** An earlier version of this file was
written on the belief that the Mailchimp **account was being closed**. It is
not. The founder — who is the cardholder — is **cancelling the paid monthly
subscription**, because email development has moved to Resend Pro. The account
and its data stay. In Mailchimp's own interface those are **two different
actions on two different screens**, and only one of them is happening.

**这份文档存在的原因是一次纠正。** 本文件的早期版本是基于"要关闭 Mailchimp 账号"
这个前提写的。事实并非如此。创始人（付款人）要做的是**取消每月付费订阅**，因为邮件
开发已经转到 Resend Pro。**账号和账号里的数据都保留。** 在 Mailchimp 的界面里，
"取消付费"和"删除账号"是两个不同页面上的两个不同操作，现在只做前者。

**For the founder.** Everything below needs the Mailchimp account itself, and
only the founder has it. Nothing here can be done from this repository.

**给创始人。** 下面每一项都需要登录 Mailchimp 账号本身，只有创始人有这个权限；
这些事在代码仓库里做不了。

Background: `docs/development/MAILCHIMP_ARCHIVE.md` (what the archive holds),
`docs/development/EMAIL_PLATFORM_STRATEGY.md` (why we are leaving),
`docs/development/PLATFORM_APIS.md` (what the API can and cannot fetch).

---

## The one-sentence version / 一句话版本

**Take the export first, run the suppression pull before the last Mailchimp
send, and then stop the billing by *pausing or downgrading* — never by
deleting.** Cancelling keeps the data; deleting destroys it, permanently, with
no grace period, and **51** links on the live website point into the account.

**先做导出，在最后一次用 Mailchimp 发信之前跑一次退订同步，然后用"暂停"或"降级"
来停止扣费——绝不要用"删除"。** 取消订阅保留数据；删除会永久销毁数据，没有任何
恢复宽限期，而网站上有 51 个链接指向这个账号。

---

## 1. Cancel is not Delete. This is the most important sentence in the file.
## 1. "取消订阅"不等于"删除账号"——这是全文最重要的一句

The two are easy to confuse because both live under Account settings and both
read as "I want to stop using this". They are not the same, and one of them
cannot be undone.

两者容易混淆：都在账户设置里，读起来都像"我不想再用了"。但它们完全不同，其中一个
无法撤销。

| Action | What happens to the data | Reversible? |
|---|---|---|
| **Pause the plan** | Kept. You can still view reports and manage the audience | Yes — it resumes |
| **Downgrade to Free** | Kept | Effectively no: **once per account lifetime** |
| **Delete the account** | **Destroyed** — audiences, campaign archives, reports | **No.** "Permanently closed and cannot be restored" |

| 操作 | 数据会怎样 | 能否撤销 |
|---|---|---|
| **暂停套餐** | 保留，仍可查看报告、管理受众 | 可以，到期自动恢复 |
| **降级到免费版** | 保留 | 实际上不能：**账号一生只能降级一次** |
| **删除账号** | **销毁**——受众、活动存档、报告全部删除 | **不能**，"永久关闭，无法恢复" |

Mailchimp's own words on deletion: it removes "all data associated with
audiences, campaign archives, and reports", and "after an account is deleted,
it's permanently closed and cannot be restored". **There is no grace period.**
The help page describes none and states the opposite; anyone who tells you there
is a window to change your mind is thinking of *pausing*.
Source: <https://mailchimp.com/help/close-an-account/>

Mailchimp 官方对"删除"的说法：会移除"所有与受众、活动存档和报告相关的数据"，且
"账号删除后即永久关闭，无法恢复"。**没有恢复宽限期。** 如果有人说还有反悔余地，
他说的是"暂停"。

**Deletion is the thing that is NOT happening.** It is described here only so
that nobody, at any point in the next few years, reaches for Delete when they
meant Cancel.

**删除这件事不会发生。** 之所以写在这里，只是为了让未来任何时候都不会有人在想
"取消付费"的时候点了"删除账号"。

- [ ] Understood: the account stays, only the billing stops / 已理解：账号保留，只停扣费

---

## 2. Choosing how the billing stops / 用哪种方式停止扣费

There is no button in Mailchimp labelled "cancel my subscription but keep
everything". The two real ways to stop paying are **pause** and **downgrade to
Free**, and each has a catch worth knowing before the click.

Mailchimp 里并没有一个叫"取消订阅但保留一切"的按钮。真正能停止扣费的只有两条路：
**暂停**和**降级到免费版**，各有一个需要提前知道的限制。

**Pause** — billing stops, data stays, reports and the audience remain usable.
**3 or 6 months**, and at most **2 pauses every 12 months**. It is temporary by
construction: the plan resumes and billing restarts when the window ends.

**暂停**——停止扣费，数据保留，报告和受众仍可使用。可暂停 **3 个月或 6 个月**，
12 个月内最多 **2 次**。它天生是临时的：窗口结束后套餐自动恢复、重新扣费。

**Downgrade to Free** — permanent, and a one-way door. Mailchimp: "You can
downgrade from any paid plan to a Free plan only once over the life of your
account." A mid-cycle downgrade "will take effect at the start of your next
billing cycle", so the current month is already paid for and there is no reason
to rush the click.
Source: <https://mailchimp.com/help/change-or-pause-your-pricing-plan/>

**降级到免费版**——永久性的单向门。Mailchimp 原话："账号一生中只能从付费套餐降级
到免费套餐一次。" 周期中途降级"会在下一个计费周期开始时生效"，也就是说当月已经付过
了，不必赶时间点这个按钮。

**The Free plan cannot send this audience, and that is fine — but only
afterwards.** The Free plan allows "up to 250 contacts". The `She#` audience is
an order of magnitude larger (print the live figure — see the last section).
Above the limit, Mailchimp says "a hold is placed on sending live emails or test
emails until you upgrade to a paid plan or reduce your contact total", while you
can still "work on your emails and templates and collect and import new
contacts". So the data is not at risk — **the ability to send is.** Since Resend
is taking over sending, that is an acceptable outcome, but it fixes the order:
**the downgrade must come after the last Mailchimp send, not before it.**
Source: <https://mailchimp.com/help/about-mailchimp-pricing-plans/>

**免费版发不了这个受众的信，这没关系——但前提是顺序不能错。** 免费版上限是
"250 个联系人"，而 `She#` 受众比这大一个数量级（实时数字见最后一节）。超出上限后，
Mailchimp 会"暂停发送正式邮件和测试邮件，直到升级套餐或减少联系人数量"，但仍然可以
"编辑邮件和模板、收集和导入联系人"。所以有风险的不是数据，而是**发信能力**。既然
发信已经交给 Resend，这个结果可以接受，但它决定了顺序：**降级必须发生在最后一次
用 Mailchimp 发信之后。**

**Which to choose.** Pause if the on-site newsletter archive (item 4) is weeks
away — it costs nothing and is fully reversible. Downgrade if it is months away
or unscheduled, because a pause window runs out and re-bills itself, and two
pauses only buy twelve months. Do not do both in the wrong order: pausing first
and downgrading later still spends the single lifetime downgrade.

**怎么选。** 如果站内通讯存档（第 4 项）几周内就能做完，选**暂停**——零成本、
可完全撤销。如果还要几个月或没有排期，选**降级**，因为暂停到期会自动恢复扣费，
而两次暂停最多也只能撑十二个月。

- [ ] Paused / 已暂停　- [ ] Downgraded to Free / 已降级到免费版　- [ ] **Not** deleted / **未**删除

---

## 3. The one thing nobody can tell you: what happens to the hosted pages
## 3. 唯一一件没人能给你答案的事：托管页面会怎样

**This is not documented by Mailchimp, and we are not going to guess.**

**这一点 Mailchimp 官方没有写，我们也不会去猜。**

The newsletter back catalogue is not hosted on our site. It is a grid of covers
that open **Mailchimp-hosted campaign pages** — `mailchi.mp/...` and
`us3.campaign-archive.com/...` URLs. What a **downgrade or pause** does to those
pages is stated nowhere:

- <https://mailchimp.com/help/about-email-campaign-archives-and-pages/> describes
  the audience archive page and the per-campaign hosted pages, and says nothing
  about downgrade, pause, cancellation or inactivity.
- <https://mailchimp.com/help/change-or-pause-your-pricing-plan/> describes the
  plan changes and says nothing about hosted pages.

Checked 2026-08-30. **Mailchimp promises nothing about their persistence, and
neither does this document.** They may well keep working indefinitely. Nobody
has written it down, so nobody can rely on it.

2026-08-30 核对。**Mailchimp 没有对这些页面的长期存在做出任何承诺，本文档同样
不做承诺。** 它们很可能会一直好用，但既然官方没写，就不能依赖。

**The honest response to an unknown is the cheap ordering, not a prediction:
archive first, cancel second.** Taking the export (item 5) before the plan
changes costs an afternoon and is correct whichever way the unknown resolves. Do
not reorder these on the assumption that the pages will survive.

**面对未知，正确的做法不是预测，而是选一个无论结果如何都成立的顺序：先归档，
后取消。** 在改套餐之前先做导出（第 5 项）只花一个下午，而不论未知如何解开，
这个顺序都是对的。

- [ ] Export taken before the plan changed / 已在改套餐之前完成导出

---

## 4. About fifty links on the live website point into Mailchimp
## 4. 网站上大约五十个链接指向 Mailchimp

Counted in the repository on 2026-08-30:

| Where | Entries | Pointing at Mailchimp |
|---|---|---|
| `lib/data/newsletters-archive.ts` | 56 | 37 `mailchi.mp` + 12 `us3.campaign-archive.com` |
| `lib/data/newsletters-manual.ts` | 4 | 2 `mailchi.mp` + 1 `us3.campaign-archive.com` |
| rendered grid (`getAllNewsletters()`, one retracted entry removed) | 59 issues | **51**, spanning 2021-10 → 2026-07 |

Seven further entries (the 2021 issues) point at a dead WordPress site and are
broken today; they have nothing to do with the cancellation. One entry, the
August 2026 issue, is served from this site (`/resources/newsletters/2026-08`)
and is unaffected.

另有 7 条 2021 年的链接指向早已下线的 WordPress 站，现在就是坏的，与本次取消无关。
2026 年 8 月那期由本站自己提供，不受影响。

**The fix is an on-site archive, and it is planned but not built.** Everything
before August 2026 exists only as a Mailchimp page, so the export in item 5 is
what makes the on-site archive possible later — the `campaigns_content` HTML
files *are* the issues. Without them there is nothing to re-host.

**解决办法是把存档搬到自己站上，但这件事只是计划，还没做。** 2026 年 8 月之前的
每一期都只存在于 Mailchimp，所以第 5 项的导出是以后做站内存档的前提——
`campaigns_content` 里的 HTML 文件**就是**那些通讯本身。没有它们就无从托管。

### The "Open full archive" button is already wrong, today, on a paid plan
### "Open full archive" 按钮现在就是错的——而且和取消订阅无关

A separate, **present-tense** defect found on 2026-08-30, independent of any
cancellation. `MAILCHIMP_CONFIG.archiveUrl` in `lib/data/newsletters.ts` is
rendered in two places:

- `app/(site)/resources/newsletters/page.tsx:48` — a button labelled
  **"Open full archive"**
- `components/layout/site-footer.tsx:101`, reading `lib/config/footer.ts:109` —
  the **"Read past issues"** link, in the footer of **every page on the site**

Fetched 2026-08-30: the URL returns **HTTP 200** and the page contains exactly
**20** `<li class="campaign">` entries across **17 distinct dates**, the oldest
**2026-02-14**. That is not a truncation bug — it is the documented behaviour:
Mailchimp's own help page says the archive "shows links to the 20 most recent
emails sent to your audience".

**So the button promises the full archive and delivers about six months of it.**
The ~180-campaign history it implies has never been reachable from that link, on
any plan. The real back catalogue is the **51 per-campaign card URLs** in
`lib/data/newsletters-archive.ts` and `lib/data/newsletters-manual.ts`, which the
grid on the same page already renders.

**所以这个按钮承诺"完整存档"，实际只给出大约半年。** 它暗示的约 180 期历史，从来
就不曾能通过这个链接访问——在任何套餐下都不能。真正的往期目录是那 51 个单期链接，
就在同一个页面的封面网格里。

**Nothing in this document changes that code.** It is written down here, and in
`docs/development/MAILCHIMP_ARCHIVE.md`, so that whoever builds the on-site
archive fixes the label or the destination at the same time. Two honest options:
relabel it ("Recent issues on Mailchimp"), or point it at the on-site archive
once that exists.

- [ ] Understood that these links break, and the export is taken first / 已知这些链接会失效，并已先做导出

---

## 5. Export what no API can recreate / 导出那些 API 拿不回来的数据

She Sharp has a Mailchimp API key and has already pulled everything it reaches
into `lib/data/json/mailchimp/`. **What the API cannot reach is only in the
account.** Under a cancellation none of it is destroyed — that is the whole
difference from the version of this file that assumed a closure. What a
cancellation can do is make some of it harder to reach, and none of it easier.

She Sharp 有 Mailchimp API 密钥，能拿到的都已经拉进 `lib/data/json/mailchimp/`。
**API 拿不到的那部分只存在于账号里。** 取消订阅不会销毁其中任何一项——这正是本文件
与"假设要关闭账号"的旧版本最大的不同。取消可能让其中一些变得更难拿到，但不会让
任何一项变得更好拿。

| What | Why no pull replaces it | Does cancellation threaten it? |
|---|---|---|
| **`CONFIRM_TIME`** — the double-opt-in confirmation timestamp | The API's nearest field, `timestamp_signup`, is populated for **129** contacts against **1,560** in the CSV export. The whole reading of *how* this list consented rests on the CSV column | **No — only deletion would.** But the CSV has already been taken and lives in the private archive; keep it that way |
| **Email templates** | Not carried by the API. The account export is the only source, and it has never been taken | **No — only deletion would.** Whether every export and template tool stays reachable on a Free plan is **not documented**; the cheap answer is to take the export while the account is unambiguously a paid one |
| **Landing pages, signup-form designs, automations** | **Not in any Mailchimp export at all** — not the API, not the ZIP. They must be **screenshotted** | **No — only deletion would.** Same unknown as above, and the same answer: screenshot **before** the plan changes, not after |
| **Per-campaign, per-recipient opens and clicks** (180 campaigns) | One manual export per campaign. Still open; nobody has done it | **No — only deletion would.** It stays possible on a live account, which is exactly why cancelling rather than deleting matters |

**The pattern in that last column is the point of this rewrite.** Almost nothing
here is destroyed by a cancellation. What a cancellation does is **remove the
convenient route** to some of it, and only a deletion would actually destroy any
of it. That is the difference between an urgent list and a careful one.

**最后一列的规律正是这次改写的重点。** 取消订阅几乎不销毁任何东西，它只是让某些
数据变得不那么好拿；真正会销毁数据的只有删除账号。这就是"紧急清单"和"稳妥清单"
的区别。

**How to export.** Profile icon → **Account** → **Settings** → **Manage my
data** → select the data types → **Export Data**. It produces a CSV of all
regular emails plus a `campaigns_content` folder of HTML and TXT files, audience
folders (subscribed / unsubscribed / cleaned / transactional), report folders,
and a templates folder. Landing pages, website content and ads are **excluded** —
screenshot those.
Source: <https://mailchimp.com/help/export-back-up-data/>

**导出方法**：头像 → **Account** → **Settings** → **Manage my data** → 勾选数据
类型 → **Export Data**。会导出所有常规邮件的 CSV、`campaigns_content` 里的 HTML
与 TXT、各类联系人文件夹、报告文件夹和模板文件夹。落地页、网站内容和广告**不在
导出范围内**——请截图保存。

Put the export in the private archive repo (`she-sharp-slack-archive`, under
`mailchimp/`), **never in this repository** — it is full of real names, email
addresses, phone numbers and sign-up IPs, and CI has leak guards against exactly
that.

导出文件放进私有归档仓库 `she-sharp-slack-archive` 的 `mailchimp/` 下，**绝不要
放进这个仓库**——里面全是真实姓名、邮箱、电话和注册 IP，CI 有专门的防泄漏检查。

- [ ] Exported and stored in the private archive / 已导出并存入私有归档
- [ ] Landing pages, signup forms and automations screenshotted / 落地页、注册表单、自动化流程已截图

> **A note that is *not* about Mailchimp, so nobody draws the wrong lesson.**
> Humanitix has six report classes its own API cannot reach — the settlement
> (payout) report, the 124-code access registry, discount codes, affiliate-code
> orders, top purchasers, and earnings by ticket type. **The Humanitix account
> is not being touched at all** — no cancellation, no downgrade, nothing. They
> are named here only because the trap has the same shape, and they are written
> up in `docs/development/PLATFORM_APIS.md` → "Humanitix — six reports the API
> has no route to". **Nothing in this document creates a Humanitix task.**
>
> **这一条不是关于 Mailchimp 的，写在这里只是免得误会。** Humanitix 也有六类报表
> 是它自己的 API 拿不到的。**Humanitix 账号完全不动**——不取消、不降级。这里提到
> 它只是因为坑的形状一样，现在不需要为它做任何事。

---

## 6. Run the suppression pull before the last Mailchimp send
## 6. 在最后一次用 Mailchimp 发信之前跑一次退订同步

```powershell
npx tsx scripts/email/suppression.ts pull-mailchimp --full
```

**The trigger is the last Mailchimp send, not the plan change.** While Mailchimp
is still the live sender, somebody who unsubscribes today exists **only** in
Mailchimp's record. The script's own header says it: `pull-mailchimp` is "the
same union, for the platform She Sharp actually sends from… someone who
unsubscribes today exists ONLY in Mailchimp's record, and `sync` cannot see
them." It pulls the `unsubscribed` and `cleaned` members and folds them into the
committed hash file, so a future import can never re-add somebody who left. The
other command, `suppression.ts sync`, folds in our own `email_optouts` table and
cannot see Mailchimp's side at all.

**触发条件是"最后一次用 Mailchimp 发信"，而不是"改套餐"。** Mailchimp 仍是实际
发信方时，今天退订的人只存在于 Mailchimp 的记录里；`suppression.ts sync` 只同步
我们自己数据库的退订表，看不到那一侧。`pull-mailchimp` 会把 `unsubscribed` 和
`cleaned` 成员折进已提交的哈希文件，这样以后任何导入都不会把已经离开的人加回来。

Do it before the plan changes too, and for a reason that survives the unknown in
item 3: nobody has established whether the Marketing API still answers on a
paused or Free account, and **a suppression pull that returns nothing looks
exactly like a suppression pull that found nothing new**. Running it while the
account is unambiguously live removes the ambiguity.

同时也请在改套餐之前跑一次，理由与第 3 项的未知有关：没人确认过暂停或免费账号下
Marketing API 是否还能调用，而**一次什么都没返回的退订同步，和"确实没有新退订"
看起来一模一样**。趁账号明确可用时跑掉，就没有这个歧义。

What it does **not** cover, so it is not a substitute for reading the account:

- It stores only `sha256(email)` — nothing here can be turned back into an
  address, by design.
- It needs `MAILCHIMP_API_KEY` (+ `MAILCHIMP_LIST_ID`) in `.env`. The key also
  expires **2027-08-27** regardless of any plan change.
- Commit the changed `lib/data/json/email-suppression-hashes.json` afterwards,
  or the pull is lost.

- [ ] Run, output checked, hash file committed / 已运行、已核对输出、哈希文件已提交

---

## 7. What stops working afterwards / 之后哪些东西会停

**"Afterwards" here means the account stops being a paid, sending account** — not
that it stops existing. That distinction is why this table is much shorter than
it was when the file assumed a closure.

这里说的"之后"，指账号不再是**付费的、能发信的**账号——不是说它不存在了。正因如此，
这张表比原来假设"关闭账号"时短得多。

| Thing | State after cancellation |
|---|---|
| Sending from Mailchimp | Stops. On Free, above 250 contacts, sending is held. This is the intended outcome — Resend takes over |
| `npx tsx scripts/email/suppression.ts pull-mailchimp` | **Unknown, treat as gone.** Nobody has established whether the Marketing API answers on a paused or Free account, which is why item 6 says run it first. `suppression.ts sync` keeps working regardless and becomes the only register update — run it monthly |
| `MAILCHIMP_API_KEY` in `.env` | Possibly still valid; do not depend on it. It is **local tooling only** — nothing under `app/` reads it, it is not set on Vercel, and it expires **2027-08-27** regardless (Mailchimp forces a one-year expiry) |
| The 2020 Mailchimp key | Still unrotated, and it never expires on its own. Deliberately not revoked because nobody has established whether the Humanitix → Mailchimp integration authenticates with it. Tier 1 in `SECURITY/credentials-to-rotate.md` in the private repo. **A cancellation does not retire a credential** — that is still open |
| `lib/data/json/mailchimp/*` | **Still valid.** Committed summaries, no API needed. `docs/development/MAILCHIMP_ARCHIVE.md` states the ways to misread them, and none of this changes that |
| The hosted campaign pages (the 51 links) | **Unknown — see item 3.** Not promised, not predicted |
| The account, its audience, its reports | **Kept.** That is the whole point of cancelling rather than deleting |

`lib/data/json/mailchimp/campaigns.json` holds **180 sends, 188,796 emails,
71,493 unique opens** (62,531 once Apple's mail proxies are excluded),
2019-07-16 → 2026-08-22. That file is committed and independent of the account —
but it is a summary. The campaigns it summarises stay in the account, which is
another reason not to delete it.

### The Humanitix → Mailchimp integration — a decision, not a to-do
### Humanitix → Mailchimp 的对接 —— 这是一个决定，不是待办

A live integration pushes each event's ticket buyers into the `She#` audience and
tags them with `Event:` and `Ticket Type:`. It has been running for about six
years. Confirmed still live on 2026-08-30: three contacts joined on 27–28 August
2026 carrying those tags and a `source` of `"Mahsa McCauley NZD"`, which is
Humanitix's documented `Store` mapping and nothing a human would type.

**It has not been pushing only the *opted-in* buyers, and that is the whole
reason this section changed.** Measured 2026-08-30: **887** of the 1,549 people
now in `newsletter_subscribers` carry that `source`, **886** of them are
Humanitix ticket buyers, and **752 of those never ticked any opt-in** — because
the integration's *"Sync contacts who haven't opted-in"* setting was on until
2026-08-27. So the integration wrote nearly half our current list in without a
consent act, and the 29 August import carried them across. The measurement is in
`../development/EMAIL_PLATFORM_STATE.md` § "How the list was actually acquired".

**这个对接推送的并不只是"勾选过"的购票者，这正是本节改写的原因。** 2026-08-30 测得：
目前 `newsletter_subscribers` 里的 1,549 人中，有 **887** 人来源为该对接，其中
**886** 人是 Humanitix 购票者，而这些人里有 **752** 人从未勾选过任何订阅选项——因为
对接的 *"Sync contacts who haven't opted-in"*（同步未勾选联系人）开关一直开着，直到
2026-08-27 才关掉。也就是说，这个对接在没有任何同意行为的情况下，把我们现有名单的近
一半写了进去，而 8 月 29 日的导入又把他们全部带了过来。

有一个仍在运行的对接，会把每场活动的购票者推进 `She#` 受众，并打上 `Event:` 和
`Ticket Type:` 标签，已经跑了大约六年。2026-08-30 确认仍然活跃。

**It is the live acquisition channel for the Humanitix checkout opt-in — consent
route 2 — but only on Mailchimp's side, and it does not filter on the opt-in.**
Be precise about this, because the halves are easy to conflate: the integration
writes the buyer into the `She#` audience — opted in or not, while that setting
was on — and nothing else. The *same* opt-in reaches our own consent
record (`newsletter_subscribers`) by a completely separate manual path — the
orders CSV, then `scripts/email/import-optin-subscribers.ts`. So switching the
integration off ends the automatic growth of the Mailchimp audience; it does
**not** end route 2, which never depended on it.

**它是 Humanitix 结账勾选（"同意来源二"）目前实际的获客渠道，但只作用在 Mailchimp
那一侧，而且它并不按勾选与否筛选。** 这几件事很容易混为一谈：对接把购票者写进 `She#`
受众（在那个开关打开期间，勾没勾选都写），仅此而已。
同一个勾选要进入我们自己的同意记录（`newsletter_subscribers`），走的是完全独立的
手动路径——先导出订单 CSV，再跑 `scripts/email/import-optin-subscribers.ts`。所以
关掉对接只是停止 Mailchimp 受众的自动增长，**并不会**断掉"同意来源二"。

**The maintainer's decision as at 2026-08-30 is to switch it off now**, ahead of
the first send and without waiting for the cancellation. **This reverses what
this section said earlier the same day** — "keep it while Mailchimp is still
billing" — and it is worth recording why, because the old reading was not silly.
It weighed one cost: a disconnected integration stops feeding the Mailchimp
audience. What it did not know was the measurement above. The integration is not
a source of consented contacts that would be lost; **for four years it has been
a source of non-consented ones**, and every day it keeps running is more rows
whose provenance nobody can defend. Keeping it costs more than losing it.

**截至 2026-08-30 的决定是：现在就关掉它**，在第一次群发之前，不必等到取消订阅。
**这推翻了本节当天早些时候的说法**（"只要 Mailchimp 还在计费就保留它"）。记录原因是
因为原来的判断并不荒唐：它权衡的是"断开对接会让 Mailchimp 受众不再增长"这一项成本，
但当时还不知道上面那组数据。这个对接并不是一个会因断开而失去的"已同意联系人"来源；
**四年来它一直是"未同意联系人"的来源**。它多跑一天，就多一批我们无法解释来源的数据。

**Nobody in this repository can press that button.** It is configured inside the
Humanitix account, and only the founder has it. The step-by-step, in plain
language, is in
[`HUMANITIX_INTEGRATION_SHUTDOWN.md`](HUMANITIX_INTEGRATION_SHUTDOWN.md).

**这个按钮不在这个代码库里，任何人都按不到。** 它配置在 Humanitix 账号内部，只有
创始人有权限。逐步操作说明（用非技术语言写的）见
[`HUMANITIX_INTEGRATION_SHUTDOWN.md`](HUMANITIX_INTEGRATION_SHUTDOWN.md)。

**What switching it off costs, stated plainly so nobody is surprised.** New
Humanitix checkout opt-ins stop reaching Mailchimp. That *is* the point —
Mailchimp is no longer where the list lives — but it means the per-event manual
harvest becomes the only route, and it is a route somebody has to actually walk:
export the orders CSV, run `scripts/email/normalize-recipients.ts --for-import`,
then `scripts/email/import-optin-subscribers.ts`. Miss an event and those ticks
are lost, because Humanitix keeps no history you can go back for. The consent
rules for that path do not change:
`.claude/skills/update-mailing-list/references/consent-rules.md`, route 2.

**关掉之后会失去什么，说清楚以免措手不及。** 新的 Humanitix 结账勾选将不再进入
Mailchimp。这正是目的——名单已经不在 Mailchimp 了——但这意味着每场活动的手动导入成为
唯一途径，而且必须真的有人去做：导出订单 CSV，跑
`scripts/email/normalize-recipients.ts --for-import`，再跑
`scripts/email/import-optin-subscribers.ts`。漏掉一场活动，那些勾选就永久丢失，
因为 Humanitix 不保留可以事后补取的记录。

- [ ] Integration switched off in Humanitix / 已在 Humanitix 中关闭该对接
- [ ] Route-2 import run for the most recent event / 最近一场活动已跑过"同意来源二"导入

---

## Order of operations / 操作顺序

1. **Export everything** (item 5), and screenshot what no export carries —
   landing pages, signup forms, automations.
2. **Put the export and the screenshots in the private archive repo**, not this one.
3. **Run `pull-mailchimp --full`** (item 6) and commit the hash file.
4. **Send the last Mailchimp newsletter**, if one is still due.
5. **Then stop the billing** — pause or downgrade to Free (item 2). **Never delete.**
6. **Disconnect the Humanitix integration** (item 7) once billing stops.

Steps 1–4 must precede step 5. Not because anything is destroyed at step 5 —
nothing is — but because the Free plan holds sending above 250 contacts, and
because what a plan change does to the API and to the hosted campaign pages is
undocumented (item 3). Every one of those uncertainties costs nothing to route
around by ordering, and cannot be undone by hurrying.

第 1–4 步必须在第 5 步之前。不是因为第 5 步会销毁什么——它不会——而是因为免费版在
250 个联系人以上会暂停发信，也因为改套餐对 API 和托管页面的影响没有官方说明
（第 3 项）。按这个顺序做，这些不确定性的代价是零；反过来赶时间，则无法挽回。

---

## Live numbers are not written down here / 这里不写实时数字

The mailable subscriber count moves. Do not quote a number from a document —
print the live one:

订阅者的可发送人数是会变的。不要从文档里抄数字，请直接打印实时值：

```powershell
npx tsx scripts/email/suppression.ts reconcile
```

Historical figures in this file are dated on purpose: the campaign totals are
the account's own history to 2026-08-22, and the link counts and the archive-page
count were taken on 2026-08-30.

---

## Related / 相关文档

- `docs/development/MAILCHIMP_ARCHIVE.md` — what the archive holds, and the
  ways to get a number wrong out of it
- `docs/development/EMAIL_PLATFORM_STRATEGY.md` — why the newsletter is being
  self-hosted, and what the Resend plan buys
- `docs/development/PLATFORM_APIS.md` — what each API key reaches, and what it
  cannot
- `docs/development/EMAIL_RESPONSIBILITY_BOUNDARIES.md` — which system sends
  what, once Mailchimp no longer sends anything
- `docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md` — the other list only the
  founder can work through
