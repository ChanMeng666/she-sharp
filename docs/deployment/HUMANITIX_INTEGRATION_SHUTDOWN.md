# Switching off the Humanitix → Mailchimp integration / 关闭 Humanitix → Mailchimp 对接

**For the founder.** This needs the **Humanitix** account, and only the founder
has it. **Nobody working in this repository can press this button** — there is no
API for it, no script, and no way to do it from the website's code. It is a
setting inside Humanitix's own console, and somebody who is logged in has to
change it by hand.

**给创始人。** 这件事需要登录 **Humanitix** 账号，只有创始人有权限。**这个代码仓库
里的任何人都做不了这一步**——没有 API，没有脚本，也没法从网站代码里操作。它是
Humanitix 后台里的一个设置，必须由登录的人手动改。

Sister document: [`MAILCHIMP_CANCELLATION.md`](MAILCHIMP_CANCELLATION.md), which
covers stopping the Mailchimp payment. **These are two separate jobs on two
separate accounts**, and this one should happen first.

姊妹文档：[`MAILCHIMP_CANCELLATION.md`](MAILCHIMP_CANCELLATION.md)（停止 Mailchimp
付费）。**这是两个账号上的两件事**，本文这件应该先做。

---

## The one-sentence version / 一句话版本

**A connection between Humanitix and Mailchimp has been quietly adding every
ticket buyer to the mailing list for years — including the ones who did not ask
to be on it — and it should be switched off now, before the first email goes out
from She Sharp's own system.**

**Humanitix 和 Mailchimp 之间有一个长期存在的对接，多年来把每一位购票者都悄悄加进了
邮件名单——包括那些从没要求加入的人。应该现在就关掉它，赶在 She Sharp 自己的系统
第一次群发之前。**

---

## What the integration is / 这个对接是什么

Humanitix (where people buy tickets) has been connected to Mailchimp (where the
newsletter has been sent from) for about six years. Every time somebody bought a
ticket, Humanitix passed their name and email to Mailchimp, added them to the
`She#` audience, and tagged them with the event name and the ticket type.

Nobody set this up recently and nobody has been watching it. It runs on its own.

Humanitix（购票平台）和 Mailchimp（过去发新闻信的平台）之间的这个对接已经跑了大约
六年。每有一个人买票，Humanitix 就把姓名和邮箱传给 Mailchimp，加进 `She#` 受众，
并打上活动名称和票种的标签。

它不是最近才设置的，也一直没人盯着。它自己在跑。

---

## What it has actually been doing / 它实际在做什么

This is the part that changed the decision.

At checkout, Humanitix can show a tick-box: *"Keep me updated on the latest news,
events, and exclusive offers from the event host."* That tick is a real, dated,
per-person consent — it is the cleanest way She Sharp collects one.

**But that switch has been off since May 2022**, so for four years nobody was
asked. And the integration had a *second* setting — **"Sync contacts who haven't
opted-in"** — which was **on** until 27 August 2026. With that on, Humanitix sent
every buyer to Mailchimp whether they had ticked anything or not, and Mailchimp
filed them as *subscribed*.

在结账页面，Humanitix 可以显示一个勾选框：*"希望收到主办方的最新消息、活动和专属
优惠"*。勾上它就是一次真实的、有时间戳的、针对个人的同意——这是 She Sharp 收集同意
最干净的方式。

**但这个开关从 2022 年 5 月起就一直是关的**，也就是说四年里根本没人被问过。而且这个
对接还有第二个设置——**"同步未勾选的联系人"**——它一直开着，直到 2026 年 8 月 27 日。
开着的时候，无论买票的人有没有勾，Humanitix 都会把他们送进 Mailchimp，而 Mailchimp
把他们记为"已订阅"。

### The numbers, measured on 30 August 2026 / 数据，2026-08-30 测得

The mailing list now held in She Sharp's own database has **1,549 people** on it.
Grouped by the strongest reason each of them is there:

| Why they are on the list | People | Share |
|---|---:|---:|
| They filled in a sign-up form themselves | 198 | 12.8% |
| They completed a separate confirmation step | 128 | 8.3% |
| They ticked the box at ticket checkout | 55 | 3.6% |
| **They bought a ticket and never ticked anything** | **752** | **48.5%** |
| **No recoverable record at all** (old spreadsheet imports) | **416** | **26.9%** |

**Just under half the list is there because the integration put them there.**
All 752 carry the connection's own fingerprint in Mailchimp — a `source` field
reading `Mahsa McCauley NZD`, which is the name Mailchimp gives the Humanitix
link — and no contact from any other source is a ticket buyer at all.

目前 She Sharp 自己数据库里的邮件名单有 **1,549 人**。按每个人"最强的加入理由"分组：

| 为什么在名单上 | 人数 | 占比 |
|---|---:|---:|
| 自己填过订阅表单 | 198 | 12.8% |
| 完成过一次独立的确认步骤 | 128 | 8.3% |
| 在购票结账时勾选了 | 55 | 3.6% |
| **买过票，但从未勾选过任何东西** | **752** | **48.5%** |
| **完全查不到来源**（早年的表格导入） | **416** | **26.9%** |

**将近一半的名单是这个对接放进去的。** 那 752 人里，几乎每一个都是从这里进来的。

**One important limit.** This does **not** prove those 752 people never wanted
our emails. Some of them may have signed up somewhere else as well; we simply
cannot tell from the records we have. What it does prove is that **we cannot
answer the question "why is this person on our list?"** for nearly half the
list — and that question is one the organisation's own rules require an answer
to before an email goes out.

**一个重要的限制。** 这**并不**证明那 752 个人不想收我们的邮件。其中有些人也许还在
别处订阅过，只是从现有记录里看不出来。它证明的是：对将近一半的名单，我们**回答不了
"这个人为什么在名单上"** 这个问题——而按组织自己的规则，在群发之前必须能回答。

---

## Why switch it off now / 为什么现在就关

Three reasons, in order of weight.

1. **It is still adding people whose consent we cannot evidence.** The
   "sync-everyone" setting is now off, so this is no longer growing — but the
   connection itself is what made those four years possible, and leaving it
   connected leaves the setting one accidental click from being back on.
2. **What it feeds is no longer the list.** The newsletter list now lives in She
   Sharp's own database. Mailchimp's audience is a copy that is already out of
   date. Anything the integration adds from here lands somewhere nobody will
   ever send from — so those sign-ups are not misplaced, they are lost, silently.
3. **It is easy to forget.** Once the Mailchimp payment stops, the audience is
   still sitting there, still growing, still looking alive in the dashboard.
   That is exactly the kind of thing that survives for another six years.

三个理由，按分量排序。

1. **它仍然在往名单里加我们无法证明其同意的人。** "同步所有人"的设置现在已经关了，
   所以不再增长——但正是这个对接让那四年成为可能，只要它还连着，那个设置离被误点回来
   就只有一步。
2. **它喂的地方已经不是名单了。** 新闻信名单现在放在 She Sharp 自己的数据库里。
   Mailchimp 的受众已经是一份过时的副本。从现在起对接加进去的任何人，都落在一个
   没人会去发信的地方——那些订阅不是放错了位置，是无声地丢了。
3. **它太容易被忘掉。** Mailchimp 停止付费之后，那个受众还在，还在增长，在后台看
   起来还是活的。这正是那种能再存活六年的东西。

---

## Exactly which screen turns it off / 具体在哪个页面关

**The exact menu path is not written down anywhere here, and this document is not
going to guess one.** No API exposes it, no screenshot of it exists in either
repository, and nobody in this codebase can open the console. What *is* known:

- The connection is **account-level, not per-event** — it applies to every event,
  so it is under the account settings and not inside any one event's editor.
- Somebody found it once, on **27 August 2026**, and changed its *"Sync contacts
  who haven't opted-in"* setting there. So it is reachable, and whoever did that
  is the fastest route to the screen.
- On the **Mailchimp** side the connection reports *"Connected to She Sharp"*.
  It may therefore also need removing from Mailchimp — check both, and note that
  `docs/development/PLATFORM_APIS.md` records a **2020 Mailchimp API key that
  was deliberately not revoked** precisely because nobody has established whether
  this integration authenticates with it. **Do not revoke that key as part of
  this** — disconnect the integration first and leave the key alone.

Sign in as the account holder at <https://console.humanitix.com> and look under
the **account** menu for *Integrations*, *Apps* or *Connected accounts*. If it is
not obvious, Humanitix support can point at it in a minute, and that is a better
use of time than searching.

**Take a screenshot of the settings page before changing anything.** There is no
record of this connection anywhere else, and once it is gone nobody here can read
back what it was set to.

**这个菜单的确切路径在我们这边没有任何记录，本文也不打算猜。** 没有 API 能读到它，
两个仓库里都没有它的截图，代码库里也没人能打开那个后台。已知的是：

- 这个连接是**账号级的，不是按活动的**——它对所有活动生效，所以在账号设置里，
  不在任何单场活动的编辑页里。
- 有人在 **2026 年 8 月 27 日**找到过它，并在那里改过 *"Sync contacts who haven't
  opted-in"* 这个设置。所以它是能找到的，而当时操作的人就是找到这个页面最快的途径。
- 在 **Mailchimp** 那一侧，这个连接显示为 *"Connected to She Sharp"*。所以可能
  两边都需要断开——两边都检查一下。另外注意
  `docs/development/PLATFORM_APIS.md` 记录了一把 **2020 年的 Mailchimp API key，
  当时故意没有吊销**，正是因为没人确认这个对接是不是靠它来认证的。**这次不要顺手
  吊销那把 key**——先断开对接，key 先放着。

以账号持有人身份登录 <https://console.humanitix.com>，在**账号**菜单下找
*Integrations*、*Apps* 或 *Connected accounts*。如果不明显，让 Humanitix 客服指一下
路只要一分钟，比自己翻划算。

**改动之前先把设置页面截图。** 这个连接在别处没有任何记录，一旦断开，这边就再也
读不回它原来的设置了。

---

## What breaks when it is off / 关掉之后会发生什么

**One thing stops, and it is the thing that is supposed to stop.** New Humanitix
checkout opt-ins will no longer reach Mailchimp automatically.

Nothing else changes. Ticketing is unaffected. Existing Mailchimp contacts stay
exactly where they are — **switching the connection off deletes nobody**. The
website, the newsletter and every email the site sends are all untouched.

**只有一件事会停止，而那正是应该停止的。** 新的 Humanitix 结账勾选不会再自动进入
Mailchimp。

其他都不变。售票不受影响。Mailchimp 里已有的联系人原样保留——**断开连接不会删除
任何人**。网站、新闻信、以及网站发出的所有邮件都不受影响。

---

## What has to happen instead / 取而代之要做什么

Two things, and the first one is one click per event.

**1. Turn the checkout tick-box on for every event.** In Humanitix:
*Edit Event → Advanced → Settings → Orders → "Enable host's mailing list
opt in"*. It is **per event** and it **defaults to off**, so it is lost by
omission unless somebody sets it every time. It was turned back on for the
3 September 2026 Les Mills event and produced its first tick on 26 August 2026 —
the first in four years. This is now the **only** way She Sharp collects a real,
dated, per-person consent at an event.

**2. After each event, bring those ticks across by hand.** Someone technical
does this; it is in the repository's own runbook. Export the orders report from
the Humanitix console (*reports → orders → Export CSV*), then run:

```
npx tsx scripts/email/normalize-recipients.ts <orders.csv> --for-import
npx tsx scripts/email/import-optin-subscribers.ts <normalised.csv>   # dry run
```

`--apply` writes them, and it also requires `--event-unsubscribers-checked`
because Humanitix keeps a per-event unsubscriber list that no export and no API
reaches — a human has to look at it first. The rules for this path are in
`.claude/skills/update-mailing-list/references/consent-rules.md`, **consent
route 2**.

**Do not skip an event.** Humanitix keeps no history you can go back for, so a
missed harvest means those ticks are gone.

两件事，第一件每场活动一次点击。

**1. 每场活动都打开结账勾选框。** 在 Humanitix 里：*Edit Event → Advanced →
Settings → Orders → "Enable host's mailing list opt in"*。它是**按活动**设置的，
而且**默认关闭**，不每次去设就会漏掉。2026 年 9 月 3 日的 Les Mills 活动已经重新
打开，并在 2026-08-26 收到了四年来的第一个勾选。这现在是 She Sharp 在活动上收集
真实、有时间戳、针对个人的同意的**唯一**途径。

**2. 每场活动之后，把这些勾选手动导进来。** 这一步由技术人员做，仓库里有操作手册：
从 Humanitix 后台导出订单报表（*reports → orders → Export CSV*），然后跑上面那两条
命令（默认是试运行）。真正写入需要加 `--apply`，而且还必须加
`--event-unsubscribers-checked`——因为 Humanitix 有一份按活动的退订名单，导出和 API
都读不到，必须有人先去看一眼。规则见
`.claude/skills/update-mailing-list/references/consent-rules.md` 的**同意来源二**。

**不要漏掉任何一场活动。** Humanitix 不保留可以事后补取的记录，漏一次那些勾选就没了。

---

## What is *not* being proposed / 不打算做的事

**Nobody is deleting anyone from the list.** Weak provenance is not proof that
somebody does not want our emails, and the suppression file that would hold them
out is one-way and cannot practically be undone. The 752 stay where they are.

What the measurement changes is the **order of the first send**: a first email
from the new system should go to the people whose consent can be named —
198 + 128 + 55 = **381 people** — rather than to the whole list at once. That is
a technical decision and the tooling for it already exists.

**没有人要从名单里删除任何人。** 来源薄弱并不等于这个人不想收我们的邮件，而用来
屏蔽他们的那个文件是单向的、事实上无法撤销。那 752 人原样保留。

这组数据改变的是**第一次群发的顺序**：新系统的第一封邮件应该先发给那些能说清同意
来源的人——198 + 128 + 55 = **381 人**——而不是一次发给整个名单。这是技术决定，
工具已经就绪。

---

## Checklist / 清单

- [ ] Screenshot the Humanitix → Mailchimp integration settings / 截图 Humanitix → Mailchimp 对接设置页
- [ ] Disconnect the integration / 断开对接
- [ ] Confirm ticketing and event pages still work / 确认售票和活动页面正常
- [ ] Turn the checkout opt-in on for the next event / 为下一场活动打开结账勾选
- [ ] Run the route-2 import after that event / 活动后跑"同意来源二"导入

---

## Where the numbers come from / 数据来源

Everything here was measured on **2026-08-30** from files already held, with no
address written anywhere:

- `docs/development/EMAIL_PLATFORM_STATE.md` § "How the list was actually
  acquired" — the tiering, its three limits, and how to re-take it
- `docs/development/EVENT_LIFECYCLE_SOP.md` § "Turn on the mailing-list opt-in" —
  the opt-in column year by year, and the evidence the switch was off
- `docs/deployment/EMAIL_AUTHENTICATION.md` item 8d — the integration's own
  settings and when each was changed
- `.claude/skills/update-mailing-list/references/consent-rules.md` — the four
  consent routes, which is the rule everything above defers to
