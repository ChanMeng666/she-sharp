# Before the Mailchimp account is closed / 关闭 Mailchimp 账号之前

**For the founder.** Everything on this list needs the Mailchimp account itself,
and only the founder has it. Nothing here can be done from this repository.

Three of the items **cannot be undone**, and they are items **1**, **3** and
**4**: the hand-export of what no API reaches, the final suppression pull, and
the choice between pausing and deleting. Each of the first two is a thing that
can only be done *while the account still works*; the third is permanent the
moment it is taken.

**给创始人。** 下面每一项都需要登录 Mailchimp 账号本身，而只有创始人有这个权限。
这些事情在代码仓库里做不了。

其中**第 1、3、4 项无法挽回**：手动导出 API 拿不到的数据、最后一次退订同步、以及
"暂停还是删除"的选择。前两件只能趁账号还能用的时候做，第三件一旦做了就是永久的。

Background: `docs/development/MAILCHIMP_ARCHIVE.md` (what the archive holds),
`docs/development/EMAIL_PLATFORM_STRATEGY.md` (why we are leaving),
`docs/development/PLATFORM_APIS.md` (what the API can and cannot fetch).

---

## The one-sentence version / 一句话版本

**Export everything by hand first, run the suppression pull last, and then
*pause or downgrade* — do not delete.** Deleting is permanent, and about fifty
links on the live website point into the account.

**先手动导出所有数据，再跑最后一次退订同步，然后选择暂停或降级——不要删除。**
删除不可恢复，而且网站上大约有五十个链接指向这个账号。

---

## 1. Export what no API can recreate — irreversible
## 1. 导出那些任何 API 都拿不回来的数据 —— 不可逆

She Sharp has a Mailchimp API key and has already pulled everything it reaches
into `lib/data/json/mailchimp/`. **What the API cannot reach is only in the
account.** Once the account is gone, so is it.

She Sharp 有一个 Mailchimp API 密钥，能拿到的数据都已经拉进
`lib/data/json/mailchimp/` 了。**API 拿不到的那部分只存在于账号里**，账号没了就没了。

| What | Why no pull replaces it |
|---|---|
| **`CONFIRM_TIME`** — the double-opt-in confirmation timestamp | The API's nearest field, `timestamp_signup`, is populated for **129** contacts against **1,560** in the CSV export. The whole reading of *how* this list consented rests on the CSV column. Recorded in `docs/development/PLATFORM_APIS.md` |
| **Email templates** | Not carried by the API. The account export is the only source, and it has never been taken |
| **Landing pages, signup-form designs, automations** | **Not in any Mailchimp export at all** — not the API, not the ZIP. They must be **screenshotted** before the account closes |
| **Per-campaign, per-recipient opens and clicks** (180 campaigns) | One manual export per campaign. Still open; nobody has done it |

**How to export.** Profile icon → **Account** → **Settings** → **Manage my
data** → select the data types → **Export Data**. It produces a CSV of all
regular emails plus a `campaigns_content` folder of HTML and TXT files,
audience folders (subscribed / unsubscribed / cleaned / transactional), report
folders, and a templates folder. Landing pages, website content and ads are
**excluded** — screenshot those.
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
> Humanitix has six report classes its API also cannot reach — the settlement
> (payout) report, the 124-code access registry, discount codes, affiliate-code
> orders, top purchasers, and earnings by ticket type. **The Humanitix account is
> not being closed**, so there is nothing to do about them today; they are named
> here only because the trap is the same shape, and it is written up in
> `docs/development/PLATFORM_APIS.md` → "Humanitix — six reports the API has no
> route to".
>
> **这一条不是关于 Mailchimp 的，写在这里只是免得误会。** Humanitix 也有六类报表
> 是它自己的 API 拿不到的。**Humanitix 账号不会关闭**，所以现在不用做任何事。

---

## 2. About fifty links on the live website point into Mailchimp
## 2. 网站上大约五十个链接指向 Mailchimp

The public newsletter archive is not hosted here. It is a grid of covers that
open Mailchimp-hosted campaign pages, and they will stop working.

公开的通讯存档并不在我们自己的站上，而是一格格封面点开跳到 Mailchimp 托管的页面。
账号关闭后这些链接会失效。

Counted in the repository on 2026-08-30:

| Where | Entries | Pointing at Mailchimp |
|---|---|---|
| `lib/data/newsletters-archive.ts` | 56 | 37 `mailchi.mp` + 12 `us3.campaign-archive.com` |
| `lib/data/newsletters-manual.ts` | 4 | 2 `mailchi.mp` + 1 `us3.campaign-archive.com` |
| rendered grid (`getAllNewsletters()`, one retracted entry removed) | 59 issues | **51** |

Plus one more URL, `MAILCHIMP_CONFIG.archiveUrl` in `lib/data/newsletters.ts`,
rendered in **two** places:

- `components/layout/site-footer.tsx:101` — the "Read past issues" link, in the
  footer of **every page on the site**
- `app/(site)/resources/newsletters/page.tsx:48` — the "Open full archive" button

Seven further entries (the 2021 issues) already point at a dead WordPress site
and are broken today; they have nothing to do with this closure.

另有 7 条 2021 年的链接指向早已下线的 WordPress 站，现在就是坏的，与本次关闭无关。

**The fix is an on-site archive, and it is planned but not built.** Only the
August 2026 issue is served from this site today
(`/resources/newsletters/2026-08`). Everything earlier exists only as a
Mailchimp page. So:

**解决办法是把存档搬到自己站上，但这件事只是计划，还没有做。** 目前只有 2026 年
8 月那期是本站提供的，更早的都只存在于 Mailchimp。所以：

- **The export in item 1 is what makes the on-site archive possible later.** The
  `campaigns_content` HTML files *are* the issues. Without them there is nothing
  to re-host.
- Until it is built, treat "keep the Mailchimp campaign archive reachable" as a
  reason not to delete the account. See item 4.

- [ ] Understood that these links break, and the export is taken first / 已知这些链接会失效，并已先做导出

---

## 3. Run the suppression pull one last time — do this last
## 3. 最后再跑一次退订同步 —— 这一步放在最后

```powershell
npx tsx scripts/email/suppression.ts pull-mailchimp --full
```

**Why it must be last, and why nothing else can do its job.** While Mailchimp is
still the live sender, somebody who unsubscribes today exists **only** in
Mailchimp's record. The other command, `suppression.ts sync`, folds in our own
`email_optouts` table — it cannot see Mailchimp's side at all. `pull-mailchimp`
reads the `unsubscribed` and `cleaned` members and folds them into the committed
hash file, so a future import can never re-add somebody who left.

**为什么必须放在最后、为什么别的办法都替代不了它。** Mailchimp 仍是实际发信方，
今天退订的人只存在于 Mailchimp 的记录里。另一条命令 `suppression.ts sync` 只能同步
我们自己数据库里的退订表，根本看不到 Mailchimp 那边。`pull-mailchimp` 会把
`unsubscribed` 和 `cleaned` 的成员折进已提交的哈希文件，这样以后任何导入都不会把
已经离开的人重新加回来。

What it does **not** cover, so it is not a substitute for reading the account:

- It stores only `sha256(email)` — nothing here can be turned back into an
  address, by design.
- It needs `MAILCHIMP_API_KEY` (+ `MAILCHIMP_LIST_ID`) in `.env`. Run it while
  the key still works.
- Commit the changed `lib/data/json/email-suppression-hashes.json` afterwards,
  or the pull is lost.

- [ ] Run, output checked, hash file committed / 已运行、已核对输出、哈希文件已提交

---

## 4. Do not delete the account. Pause or downgrade.
## 4. 不要删除账号，请选择暂停或降级

This is the item most likely to be got wrong, because "cancel the subscription"
and "delete the account" look like the same action in the billing screen.

这一条最容易做错，因为在账单页面里，"取消订阅"和"删除账号"看起来像是同一件事。

Mailchimp's own help page
(<https://mailchimp.com/help/close-an-account/>) says:

- **Deleting** removes "all data associated with audiences, campaign archives,
  and reports", and "after an account is deleted, it's permanently closed and
  **cannot be restored**". **Do not assume a reactivation grace period.** The
  help page describes none, and states the opposite; if anybody tells you there
  is a window to change your mind, they are thinking of pausing.
- **Pausing** stops monthly billing while keeping the data. **3 or 6 months**,
  at most **2 pauses every 12 months**. You can still view reports and manage
  the audience while paused.
- **Downgrading** to a cheaper feature plan or contact tier keeps the data and
  keeps the service active — the better option if the pause window would run out
  before the on-site archive exists.

- **删除**会移除"所有与受众、活动存档和报告相关的数据"，而且"账号删除后即永久关闭，
  **无法恢复**"。**不要以为有什么恢复宽限期**——帮助页面里没有，而且说法正好相反；
  如果有人告诉你还有反悔的余地，他说的是"暂停"。
- **暂停**停止月度扣费但保留数据，可暂停 **3 个月或 6 个月**，12 个月内最多 **2 次**。
- **降级**到更便宜的套餐同样保留数据，服务继续可用——如果站内存档在暂停期结束前
  还做不完，降级是更稳妥的选择。

**What is at stake beyond the links.** `lib/data/json/mailchimp/campaigns.json`
holds **180 sends, 188,796 emails, 71,493 unique opens** (62,531 once Apple's
mail proxies are excluded), 2019-07-16 → 2026-08-22. That file is committed and
survives the closure — but it is a summary. The campaigns it summarises are only
in the account, and so is anything anybody later wants to check it against.

**除了链接之外还有什么在里面。** `lib/data/json/mailchimp/campaigns.json` 里记着
**180 次发送、188,796 封邮件、71,493 次去重打开**（排除 Apple 邮件代理后为 62,531），
时间跨度 2019-07-16 至 2026-08-22。这个文件已提交、不受关闭影响——但它只是汇总，
被汇总的那些活动本身只在账号里。

- [ ] Paused / 已暂停　- [ ] Downgraded / 已降级　- [ ] **Not** deleted / **未**删除

---

## 5. What becomes dead afterwards / 关闭之后哪些东西就作废了

Recorded so nobody trusts them later. **"Closure" here means the account stops
answering** — a delete certainly, a downgrade or a pause possibly. That
uncertainty is exactly why item 3 runs *before* item 4 and not after.

写下来，免得以后有人还当它们是活的。这里说的"关闭"指**账号不再响应**——删除必然如此，
降级或暂停则不一定。正因为不确定，第 3 步才必须排在第 4 步之前。

| Thing | State after closure |
|---|---|
| `npx tsx scripts/email/suppression.ts pull-mailchimp` | Dead. It calls the Mailchimp API. `suppression.ts sync` continues to work and becomes the only register update — run it monthly |
| `MAILCHIMP_API_KEY` in `.env` | Dead. It is **local tooling only** — nothing under `app/` reads it, and it is not set on Vercel. It expires **2027-08-27** regardless (Mailchimp forces a one-year expiry) |
| The 2020 Mailchimp key | Also dead, and it never expires on its own. It was deliberately not revoked because nobody has established whether the Humanitix → Mailchimp integration authenticates with it. Tier 1 in `SECURITY/credentials-to-rotate.md` in the private repo |
| `lib/data/json/mailchimp/*` | **Still valid.** Committed summaries, no API needed. `docs/development/MAILCHIMP_ARCHIVE.md` states the eight ways to misread them, and closure changes none of that |

### The Humanitix → Mailchimp integration — a decision, not a to-do
### Humanitix → Mailchimp 的对接 —— 这是一个决定，不是待办

A live integration pushes each event's opted-in ticket buyers into the `She#`
audience and tags them with `Event:` and `Ticket Type:`. It has been running for
about six years. Confirmed still live on 2026-08-30: three contacts joined on
27–28 August 2026 carrying those tags and a `source` of `"Mahsa McCauley NZD"`,
which is Humanitix's documented `Store` mapping and nothing a human would type.

有一个仍在运行的对接，会把每场活动中勾选了营销选项的购票者推进 `She#` 受众，并打上
`Event:` 和 `Ticket Type:` 标签，已经跑了大约六年。2026-08-30 确认仍然活跃。

**It is the live acquisition channel for the Humanitix checkout opt-in — consent
route 2 — but only on Mailchimp's side.** Be precise about this, because the two
halves are easy to conflate: the integration writes the opted-in buyer into the
`She#` audience, and nothing else. The *same* opt-in reaches our own consent
record (`newsletter_subscribers`) by a completely separate manual path — the
orders CSV, then `scripts/email/import-optin-subscribers.ts`. So switching the
integration off ends the automatic growth of the Mailchimp audience; it does
**not** end route 2, which never depended on it.

**它是 Humanitix 结账勾选（"同意来源二"）目前实际的获客渠道，但只作用在 Mailchimp
那一侧。** 这两半很容易混为一谈：对接只把勾选过的购票者写进 `She#` 受众，仅此而已。
同一个勾选要进入我们自己的同意记录（`newsletter_subscribers`），走的是完全独立的
手动路径——先导出订单 CSV，再跑 `scripts/email/import-optin-subscribers.ts`。所以
关掉对接只是停止 Mailchimp 受众的自动增长，**并不会**断掉"同意来源二"。

**The maintainer's decision as at 2026-08-30 is to keep it while Mailchimp is
still billing.** It costs nothing extra and keeps six years of behaviour intact.
Its trigger, not a date:

**截至 2026-08-30 的决定是：只要 Mailchimp 还在计费，就保留它。** 触发条件如下，
不是一个日期：

> **When the Mailchimp account is paused, downgraded or closed, the integration
> keeps syncing opted-in buyers into an audience nobody sends from.** At that
> moment it stops being useful and becomes a silent write into a dead list — so
> disconnect it, and make sure `scripts/email/import-optin-subscribers.ts` is
> being run per event, because it is then the only way a checkout opt-in reaches
> any list we can send from.

> **一旦 Mailchimp 被暂停、降级或关闭，这个对接就变成往一个没人发信的受众里静默
> 写数据。** 那时它已经没有用了，请断开它，并确保每场活动都实际跑过
> `scripts/email/import-optin-subscribers.ts`——那时它是结账勾选进入可发信名单的
> 唯一途径。

The consent rules for that path do not change:
`.claude/skills/update-mailing-list/references/consent-rules.md`, route 2.

- [ ] Integration decision reviewed at the trigger / 触发时已重新评估这个对接

---

## Order of operations / 操作顺序

1. **Export everything** (item 1), and screenshot what no export carries.
2. **Take the screenshots and files into the private archive repo**, not this one.
3. **Run `pull-mailchimp --full`** (item 3) and commit the hash file.
4. **Then, and only then, pause or downgrade** (item 4). Not delete.
5. **Disconnect the Humanitix integration** (item 5) once billing stops.

Do not reorder 3 and 4: pausing may or may not keep the API answering, and a
suppression pull that returns nothing looks exactly like a suppression pull that
found nothing new.

第 3 步和第 4 步的顺序不能调换：暂停之后 API 是否还能调用并不确定，而一次什么都没
返回的退订同步，看起来和"确实没有新退订"一模一样。

---

## Live numbers are not written down here / 这里不写实时数字

The mailable subscriber count moves. Do not quote a number from a document —
print the live one:

订阅者的可发送人数是会变的。不要从文档里抄数字，请直接打印实时值：

```powershell
npx tsx scripts/email/suppression.ts reconcile
```

Historical figures in this file are dated on purpose: the campaign totals are
the account's own history to 2026-08-22, and the link counts were taken from
the repository on 2026-08-30.

---

## Related / 相关文档

- `docs/development/MAILCHIMP_ARCHIVE.md` — what the archive holds, and the
  eight ways to get a number wrong out of it
- `docs/development/EMAIL_PLATFORM_STRATEGY.md` — why the newsletter is being
  self-hosted, and what the Resend plan buys
- `docs/development/PLATFORM_APIS.md` — what each API key reaches, and what it
  cannot
- `docs/development/EMAIL_RESPONSIBILITY_BOUNDARIES.md` — which system sends
  what, once Mailchimp no longer sends anything
- `docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md` — the other list only the
  founder can work through
