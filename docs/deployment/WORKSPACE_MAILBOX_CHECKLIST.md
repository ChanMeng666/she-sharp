# Google Workspace mailbox checklist / 邮箱核查清单

**For the Workspace super-admin.** Everything on this list needs
`admin.google.com`, and only the founder's account has it — `website@` does
not. Nothing here can be done from this repository.

**给 Google Workspace 超级管理员。** 下面每一项都需要登录
`admin.google.com`，而目前只有创始人的账号有这个权限（`website@` 没有）。这些
事情在代码仓库里做不了。

Background: `docs/development/EMAIL_ADDRESSES.md`.
Rerun the evidence with `npx tsx scripts/email/probe-mailboxes.ts --send`.

---

## What happened / 背景

On 2026-08-23 a delivery probe established that **seven of the eleven email
addresses printed on the She Sharp website did not exist**. They had been
invented by page templates in 2025 and published ever since. Ten days earlier
the National Convenor of the Association for Women in the Sciences told us, via
the contact form, that she had tried emailing and got a bounceback. She did not
say which address, so this is not proof that it was one of the seven — but it is
what a published address that does not exist looks like from outside.

The website has been changed so that every published address is one that
accepts mail. **The website side is fixed. This list is the part only you can
do.**

2026-08-23 的一次送达探测证实：**网站上公布的 11 个邮箱里，有 7 个根本不存在**。
它们是 2025 年生成页面模板时被"造"出来的，此后一直印在站上。十天前，新西兰女性
科学工作者协会（AWIS）的全国召集人通过网站表单告诉我们，她先发过邮件但被退回。
她没说是哪个地址，所以这并不能证明就是这七个之一——但一个不存在的公开邮箱，从
外面看就是这个样子。

网站已经改好，现在公布的每一个地址都能收到信。**网站这边已经完成，下面这些只有
你能做。**

---

## The list / 清单

### 1. Create `conduct@` as a restricted group — highest value
### 1. 把 `conduct@` 建成一个受限群组 —— 最重要的一条

A code of conduct report is confidential by definition. It currently goes to
`info@`, a shared inbox opened about once or twice a week whose contents are
mostly advertising, because the alternative was an address that bounced. That
is a stopgap, not an answer.

Create `conduct@shesharp.org.nz` as a **Google Group** whose members are the
Chair and one other trustee, and tell the website team. Changing one line in
`lib/config/contact-addresses.ts` then moves every reporting route on the site.

行为准则举报按定义是保密的。它现在寄到 `info@` —— 一个多人共享、一周只被查看
一两次、里面大部分是广告的收件箱。之所以这样，是因为原来的地址会退信。这是权宜
之计，不是正解。

请把 `conduct@shesharp.org.nz` 建成一个 **Google 群组**，成员只有主席和另一位
理事，然后告诉网站团队。之后只需改代码里的一行，站上所有举报入口就会一起切换。

- [ ] Done / 完成

### 2. Confirm the catch-all is OFF
### 2. 确认没有开启"全部投递"（catch-all）

The probe's answer only means something if Google is rejecting unknown
recipients. Check **Apps → Google Workspace → Gmail → Default routing** and
confirm there is no rule that catches everything. If there is one, the probe
proved nothing and this whole list needs redoing from the admin console.

只有在 Google 会拒收"不存在的收件人"时，探测结果才有意义。请到
**应用 → Google Workspace → Gmail → 默认路由** 确认没有一条"全部接收"的规则。
如果有，那么这次探测什么都没证明，整份清单需要改从管理后台核对一遍。

- [ ] Done / 完成

### 3. Name an owner for four mailboxes that nobody watches
### 3. 给四个无人认领的邮箱指定负责人

Each of these accepts mail and then nothing happens. Either name a person, or
decide to retire it.

这四个邮箱能收到信，然后就没有然后了。请给每个指定一个负责人，或者明确决定弃用。

| Mailbox | Why it matters / 为什么要紧 |
|---|---|
| `newsletter@` | The visible sender on every newsletter. Nobody had its password on 2026-08-17. Replies no longer go here, but the address still represents She Sharp to every subscriber / 每期通讯的发信人。2026-08-17 全队没人知道它的密码 |
| `marketing@` | Asked in August 2025 who had access; never answered / 2025 年 8 月问过谁有权限，无人回答 |
| `governance@` | Published on the volunteer code of conduct page and it does receive mail, but no reader is known / 印在志愿者行为准则页上，确实能收信，但不知道谁在读 |
| `events@` | Attendee questions, and the ticketing account login. Shared, so "everyone" can mean "nobody" / 参会者提问用，也是票务账号登录名。共享账号，"大家都能看"往往等于"没人看" |

- [ ] Done / 完成

### 4. Rotate three credentials that are sitting in plain text
### 4. 轮换三个明文躺着的凭据

These are recorded in the private archive's credential list, with locations but
never values. They are on this page because each one is a mailbox.

这三条记录在私有归档的凭据清单里（只记位置，不记内容）。放在这里是因为每一条都
关系到一个邮箱。

- **`events@`** — the ticketing account password was sent in plain text in a
  direct message on 2026-08-17, by someone who is not a committee member. That
  account is the system of record for every attendee She Sharp has ever had:
  names, mobiles, addresses, dates of birth.
  票务账号密码 2026-08-17 由一位非委员会成员在私聊里明文发出。该账号是历年所有
  参会者信息的系统源头。
- **`website@`** — the mailbox password is in plain text in a direct message,
  and the same password reaches the mailbox, Webflow **and** Resend.
  邮箱密码明文在私聊里，而同一个密码同时打通邮箱、Webflow 和 Resend。
- **`podcast@`** — the password was posted in a public channel in 2023.
  密码 2023 年发在公开频道里。

- [ ] Done / 完成

### 5. Remove the production `NEWSLETTER_ADMIN_EMAIL`
### 5. 删除生产环境的 `NEWSLETTER_ADMIN_EMAIL`

This variable addressed the monthly "draft ready for review" email. That email
is gone — the newsletter is no longer generated in the cloud, so nothing read
the variable any more. It was dead config rather than a live leak, but it may
still have named a personal Gmail, so it was deleted on **2026-08-30** with
`vercel env rm NEWSLETTER_ADMIN_EMAIL production`; `vercel env ls production` no
longer lists it.

One thing worth knowing before deleting any variable, because it happened here:
a `vercel env pull` taken immediately beforehand returned this variable as `""`,
while `BASE_URL`, `CRON_SECRET` and `EMAIL_UNSUBSCRIBE_SECRET` in the same pull
came back with real values. That is the trap CLAUDE.md documents — CLI ≥54
defaults new variables to **Sensitive**, and `pull` returns those as an empty
string, which is indistinguishable from a genuinely empty one. So **no
exact-value rollback was ever possible**, and none was needed: nothing reads it.
Take that as the rule — capture a value you might want back *before* the pull
tells you it is empty, because it may not be telling you that at all.

这个变量原本是月度"草稿已就绪"邮件的收件人。那封邮件已经不存在了——通讯不再在云端生成，
代码里也再没有任何地方读它。它是死配置而不是活的泄露，但值可能还是一个私人 Gmail，
所以已于 **2026-08-30** 用 `vercel env rm NEWSLETTER_ADMIN_EMAIL production` 删除，
`vercel env ls production` 里已经看不到它了。

删除前值得记住一件事，因为这次就遇上了：紧接删除之前的一次 `vercel env pull` 把这个变量
读成了 `""`，而同一次 pull 里的 `BASE_URL`、`CRON_SECRET`、`EMAIL_UNSUBSCRIBE_SECRET`
都拿到了真实的值。这正是 CLAUDE.md 里记着的坑——CLI ≥54 默认把新变量设为 Sensitive，
`pull` 会把它们返回成空字符串，与真的为空无法区分。所以**当时根本无法按原值回滚**，
好在也不需要：没有任何代码读它。

- [x] Done / 完成 — 2026-08-30

### 6. Decide about the AUT address on two old event pages
### 6. 决定两个旧活动页上那个 AUT 邮箱怎么办

`lib/data/json/shesharp_events_v3.json` renders a live `mailto:` link to the
founder's **AUT university address** in the "Key contact" block of the 2023 and
2024 Google Educator Conference pages. It is a third-party domain, so it is
outside both the probe and the organisation's control. Only you can say whether
you still want questions about a 2023 conference.

2023 和 2024 两届 Google Educator Conference 的详情页上，"Key contact" 里有一个
可点击的 `mailto:` 链接，指向创始人的 **AUT 学校邮箱**。那是第三方域名，既不在
探测范围内，也不受组织控制。是否还愿意接收关于 2023 年那场会议的来信，只有你能
决定。

- [ ] Keep / 保留　- [ ] Remove / 移除

### 7. Google DKIM — while you are already in the admin console
### 7. 顺手把 Google DKIM 开了

Already an open item in `docs/deployment/EMAIL_AUTHENTICATION.md`, and blocked
on the same account this whole list is blocked on. Mail sent by people *from*
their `@shesharp.org.nz` mailboxes is not DKIM-signed until this is switched
on. Folded in here so it is one sitting rather than two.

这条本来就是 `docs/deployment/EMAIL_AUTHENTICATION.md` 里的待办，卡在同一个账号
上。在开启之前，团队成员**用自己的 `@shesharp.org.nz` 邮箱发出的信**没有 DKIM
签名。放在这里是为了让你一次登录把事情做完，而不是分两趟。

- [ ] Done / 完成

---

## What the website already does / 网站这边已经做完的

No action needed on these — recorded so the two halves can be reconciled.

这些不需要你做任何事，列出来是为了对账。

- Every address published on the site now accepts mail, verified 2026-08-23.
- The newsletter's Reply-To moved off `newsletter@` to `info@`. **The From is
  unchanged** and must stay `newsletter@` — that is the address subscribers
  recognise and its reputation is what carries the Mailchimp → Resend move.
- The security page no longer promises PGP encryption. Nobody held a key.
- `events@` is now on every upcoming event page, and `people@` on the
  join-our-team page. Both had been missing from the site entirely.
- A guard in `lib/email/hardening.test.ts` fails the build if a retired address
  is reintroduced as a sender.
- `scripts/email/probe-mailboxes.ts` reruns the whole audit on demand.
