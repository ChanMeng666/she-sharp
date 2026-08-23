# Using She Sharp's AI Skills — a guide for everyone

**Who this is for:** anyone on the She Sharp team who needs to send email, add an
event to the website, or answer the people who write to us — **whether or not you
have ever written a line of code.**

You will not be writing code. You will be typing sentences into a chat box, and
an AI assistant will do the work while showing you exactly what it is about to do
and waiting for you to say yes.

**How long the one-time setup takes:** about 30–45 minutes, once. After that,
starting a task takes about ten seconds.

**The one thing to understand before you begin:** nothing is sent, and nothing is
changed, until you read a summary and explicitly approve it. Every skill in this
guide is built to stop and show you its plan first. If you ever feel unsure, you
can say "stop" or "show me that again" at any point.

---

## Table of contents

1. [What you'll be able to do](#1-what-youll-be-able-to-do)
2. [One-time setup](#2-one-time-setup)
3. [How to use a skill](#3-how-to-use-a-skill)
4. [The golden rules](#4-the-golden-rules)
5. [The skills, one by one](#5-the-skills-one-by-one)
6. [When something goes wrong](#6-when-something-goes-wrong)
7. [Words you'll see](#7-words-youll-see)

---

## 1. What you'll be able to do

Eleven skills live inside this project. Each one is a written procedure the AI
follows, so it does the task the same careful way every time.

**If you only remember one, remember `/run-event-playbook`.** It is the way in:
it works out where your event has got to and tells you which of the others to
run next, so you never have to hold the order in your head.

| Skill | What it does | Who usually needs it |
|---|---|---|
| `/run-event-playbook` | Walks one event from the planning channel to the photographs, calling the others in order | Event organisers |
| `/sync-event-from-slack` | Turns an event-planning Slack channel into a page on the website | Event organisers |
| `/make-event-poster` | Makes the artwork — the ticketing banner, the social posts, the print poster, and one graphic per speaker | Event organisers |
| `/build-event-slides` | Builds the slide deck the room sees, at `/present/<event>` | Event organisers |
| `/tweak-event-slides` | Makes one small change to slides that already exist, and puts it live in about four minutes | Event organisers, on the day |
| `/send-event-emails` | Emails the people who registered for one event — reminders, joining details, thank-yous | Event organisers |
| `/promote-event` | Tells the mailing list about an event that has not happened yet | Anyone doing comms |
| `/email-the-community` | Sends one announcement to the whole mailing list | Anyone doing comms |
| `/update-mailing-list` | Shows who is on the mailing list, and adds people who agreed to join | Anyone managing the list |
| `/monthly-newsletter` | Builds and schedules the monthly newsletter | Newsletter editor |
| `/reply-to-contact-messages` | Answers the people who filled in the contact form on the website | Anyone doing comms |

The four email skills are the focus of this guide. The event skills are included
because they are one toolkit and they depend on each other in a fixed order —
`/send-event-emails`, `/make-event-poster` and `/build-event-slides` all read the
date and venue from the website, so `/sync-event-from-slack` has to have put the
event there first. `/run-event-playbook` exists so you do not have to remember
that; the order, with every gate and what goes wrong, is written down in
`docs/development/EVENT_LIFECYCLE_SOP.md`.

`/tweak-event-slides` is the odd one out: it is the only skill here that changes
the live website without stopping to ask, which is deliberate, and it is only for
the small change you need on screen in the next five minutes.

**One skill cannot finish today, and that is expected.** `/promote-event` needs a
mailing list in Resend, and the newsletter still goes out through Mailchimp, so
the Resend list is effectively empty. Run `/update-mailing-list` first. The skill
says so itself rather than failing in a confusing way.

---

## 2. One-time setup

Work through these in order. Each part ends with a way to check it worked, so you
never move on with something half-finished.

> **A note about asking for help.** Steps D and E need things only an admin can
> give you. That is normal and expected — it is not you doing something wrong.

### Part A — Install Cursor

Cursor is a free app that looks like a text editor with an AI chat panel on the
side. It is where you will do everything.

1. Go to **<https://cursor.com>** and click **Download**. Pick the version for
   your computer (Windows or Mac) — the site usually detects this for you.
2. Open the downloaded file and follow the installer.
3. Launch Cursor. It will ask you to sign in or create an account — do that.
4. It may offer to import settings from another editor. If you have never used
   one, choose the option to skip.

**Check it worked:** Cursor opens and you can see a chat panel down one side of
the window — a box you can type into, usually on the right.

If you can't see it, look for a chat or sparkle icon in the top-right corner, or
open the **View** menu and choose the chat/agent panel. Cursor has moved this
around between versions, so trust what you see on screen over any shortcut key
someone quotes you.

### Part B — Install the three background tools

These are free tools that don't have windows — they work quietly underneath.
Install all three even if you don't know what they are.

**1. Git** — how the project gets onto your computer and stays up to date.

- Windows: download from <https://git-scm.com/download/win> and run the
  installer. Accept every default by clicking Next.
- Mac: open the **Terminal** app (find it with Spotlight, `Cmd+Space`, and type
  "Terminal"), paste `git --version`, and press Enter. If Git isn't installed,
  macOS will offer to install it — say yes.

**2. Node.js version 22** — this project runs on it.

- Go to <https://nodejs.org> and download the version labelled **22 LTS**.
- "LTS" means Long Term Support. **Do not pick the newest number** if it isn't
  22 — this project is tested against 22.
- Run the installer and accept the defaults.

**3. The Resend command-line tool** — this is what actually sends the email.

Open a terminal:
- In Cursor: **Terminal → New Terminal** from the top menu.
- Or use the Terminal app (Mac) / Command Prompt (Windows).

Paste this and press Enter:

```
npm install -g resend-cli
```

**Check it worked:** in the same terminal, run each of these. Each should print a
version number or a path rather than "not found":

```
git --version
node --version
resend --version
```

`node --version` should start with `v22`.

### Part C — Get the project onto your computer

1. Decide where the project will live. Somewhere simple is best — for example
   `Documents`.
2. In Cursor, choose **File → Open Folder**, navigate to that place, and open it.
3. Open a terminal in Cursor (**Terminal → New Terminal**) and paste:

```
git clone https://github.com/NZ-SheSharp/she-sharp.git
```

If it asks you to sign in to GitHub, do so. If it says you don't have access, ask
an admin to add you to the **NZ-SheSharp** organisation on GitHub.

4. When it finishes, choose **File → Open Folder** again and open the newly
   created **she-sharp** folder itself. This matters: the tools only work when
   Cursor has the `she-sharp` folder open, not its parent.

**Check it worked:** the file list on the left shows folders named `app`,
`components`, `lib`, and a file called `package.json`.

### Part D — Install the project's parts

In Cursor's terminal, paste:

```
npx pnpm@10 install
```

This downloads everything the project depends on. It takes a few minutes and
prints a lot of text — that is normal.

> **Why `pnpm@10` and not just `pnpm`?** Newer versions of pnpm change a file
> that this project shares with its deployment system, which breaks the website
> build. Pinning to 10 avoids that. It costs you nothing.

**Check it worked:** a new `node_modules` folder appears in the file list, and
the last lines of output say "Done" rather than "ERR".

### Part E — The secrets file

The tools need passwords and keys to reach the database, Slack and Resend. These
live in a file called `.env` in the project folder. **This file is deliberately
never stored on GitHub**, so you have to get it from an admin.

**Ask an admin for the `.env` file.** Say: *"Can you send me the `.env` file for
the she-sharp project so I can run the email skills?"*

When you receive it:

1. Save it into the `she-sharp` folder — the same folder that has
   `package.json`.
2. Make sure the filename is exactly `.env` — no `.txt` on the end. Windows
   sometimes adds one; if so, rename it.

**Rules about this file, which matter:**

- **Never paste its contents into a chat**, including the AI chat. If a skill
  needs a value, it reads the file itself.
- Never email it, put it in Slack, or copy it into another folder.
- If you ever think it has been shared by accident, tell an admin immediately.
  Keys can be replaced; the harm comes from waiting.

**Check it worked:** you can see `.env` in the file list. (Cursor may grey it out
— that's fine, it means Cursor knows it's private.)

### Part F — Connect the Resend tool

Ask an admin for a **Resend API key with full access**. In the terminal, paste
this, replacing the placeholder with the real key:

```
resend login --key re_your_key_here
```

**Check it worked:**

```
resend whoami
```

You should see `"authenticated": true` and `"permission": "full_access"`. If it
says `sending_access` instead, ask the admin for a full-access key — the mailing
list skills cannot work without one.

### Final check — is everything ready?

Open the Cursor chat panel and type exactly this:

```
Check that I'm set up to run the email skills: confirm the repo root, DATABASE_URL, SLACK_BOT_TOKEN, and that resend whoami is authenticated. Don't send anything.
```

The AI will run the checks and tell you what is present and what is missing. If
something is missing, it will say which one — take that message to an admin.

---

## 3. How to use a skill

### Starting a skill

1. Click into Cursor's chat panel (the one you found in Part A).
2. Type **`/`** — a list of available skills appears.
3. Start typing the name to narrow it down, e.g. `/reply`.
4. Pick the one you want and press Enter.

You can also just describe what you want in plain words — "I need to reply to the
contact form messages" — and the assistant will usually pick the right skill by
itself. Typing `/` is simply the more certain way.

> **Note for anyone comparing tools:** these skills live in a folder called
> `.claude/skills/`. Cursor reads that folder as well as its own, so the same
> skills work in Cursor, Claude Code and Claude Desktop with no changes.

### What happens next

Every skill follows the same rhythm. Learning it once means you know how all six
behave.

**1. It looks at the current situation and tells you.**
For example, it will say how many contact-form messages are waiting, or how many
people are on the mailing list. It has not changed anything yet.

**2. It asks you a few questions.**
Every question comes with a sensible default. If you don't have an opinion, say
"whatever you think" or just "yes" — it will use the default and tell you which
one it used.

**3. It does a practice run.**
It writes the email to a file on your computer and checks it: not too big for
Gmail, all the links complete, images in a format Outlook can display, no
passwords accidentally included. Then it asks the sending service to describe
what it *would* send, without sending it.

**4. It shows you a plan and stops.**
A short summary: who it will go to, what the subject line is, what happens after.
There is a `Redactions:` line listing anything it deliberately left out — a
booking link, a document link, a code. **Read that line.** It is there so you can
say "actually, keep that in".

**5. You say yes — or don't.**
Say "send" (or "发吧", or "go ahead") and it proceeds. Say anything else and it
adjusts and shows you a new plan. There is no way to accidentally skip this step.

**6. It confirms and records what happened.**

### Things that are always safe to say

- **"stop"** — it stops. Nothing that hasn't already been sent will be sent.
- **"show me the email first"** — it opens the drafted email in your browser.
- **"explain that"** — it explains any step in plain words.
- **"send a test to me first"** — every email skill supports this. **Do it the
  first few times.** You give it your own address and see the real email.
- **"what would this do?"** — it describes without doing.

---

## 4. The golden rules

Five things worth knowing before you send anything to a real person.

**1. Sent email cannot be recalled.**
This is why every skill stops and shows you a plan. Read it. A subject line typo
reaches everyone.

**2. Registering for an event is not the same as subscribing.**
Somebody who bought a ticket agreed to hear about *that event*. They did not
agree to a newsletter. The same goes for people who donated, applied to be
mentored, or wrote to us. The tools enforce this — if you try to send a promotion
to event registrants, the skill will refuse and explain why. **That refusal is
the tool working correctly, not a bug.** The only ways to grow the mailing list
are people signing up themselves, or ticking a box that says so.

**3. Never put codes or private links in an email.**
Registration codes, discount codes, meeting passwords, links to internal
documents. Link to the public page instead. The tools scan for these and list
them on the `Redactions:` line, but the tools cannot catch everything.

**4. Some messages need a human, not a template.**
If a message involves a child or teenager, someone's safety, a complaint, or
someone's immigration status, the skill will stop and hand it to you. **When it
does that, do not push it to write a reply anyway.** Take it to a person on the
team who can make that call.

**5. Test on yourself first.**
Every email skill lets you name a test mailbox. Nothing is hard-coded. For your
first few sends, use your own address and look at the result on both a computer
and a phone.

---

## 5. The skills, one by one

### 5.1 `/reply-to-contact-messages` — answer the people who wrote to us

**What it does.** People who fill in the contact form on the website land in a
list that nobody has been working through. This skill shows you who is waiting,
helps you write a reply in She Sharp's voice, sends it, and marks the message
handled so nobody replies twice.

**Before you start:** nothing. You can open this one cold.

**Say this:**

```
/reply-to-contact-messages
```

or in plain words:

- "Who hasn't been replied to yet?"
- "Help me clear the contact form inbox."
- "Reply to the person who asked about mentoring."
- "谁还没回" / "回一下联系表单"

**What you'll see first.** A list like this:

```
#9    2026-07-20  Mahsa Shoja <s***@gmail.com>          general      matched
#10   2026-07-21  May Li <l***@gmail.com>               general      matched
#11   2026-07-22  Hannah Melotto <h***@…>               vendor-pitch matched
```

The last-but-one column is the assistant's guess at what kind of message it is:

| Label | Meaning | What happens |
|---|---|---|
| `general` | A real question from a real person | You write a reply |
| `sponsor` | Someone asking about sponsorship | Different template, different tone |
| `vendor-pitch` | An agency selling us web design, SEO, "a quick call" | **It asks you** whether to ignore it. It will never decide this alone |
| `qa-test` | A test submission from our own team | Marked handled, no email sent |

**What it will ask you:**

| Question | If you have no preference |
|---|---|
| Which messages to answer? | It starts with the ones nobody has answered |
| What should the reply say? | **It will ask, and it should.** Give it the gist — full sentences are not needed |
| Which mailbox is it from? | `info@shesharp.org.nz`, with mentoring questions replying to `mentoring@` and sponsorship to `industry@` |
| Should it note "replied" in Slack? | Yes |

**How to give it the gist.** You do not write the email. You tell it what is
true, and it writes it in She Sharp's voice:

> "Tell her mentoring applications are paused right now, we expect to reopen for
> the next round, and she should come to an event to hear first."

It will not invent facts you didn't give it. If it needs a date or a price it
doesn't have, it will ask you rather than guess.

**Before you approve, check:** the person's name is right, the facts are the ones
you gave it, and there's only one link or button.

**What it will never do:** email a test row; decide on its own that a message is
junk; mention another person's enquiry in a reply; write a reply about a child's
participation or a safety concern.

---

### 5.2 `/update-mailing-list` — see and update who gets our email

**What it does.** Shows who is currently on the mailing list, and adds people from
a spreadsheet — but only people who genuinely agreed to be added.

**This skill sends no email at all.** It is safe to run just to look.

**Before you start:** for a look, nothing. To add people, a CSV file (a
spreadsheet saved as "CSV") of the people to add.

**Say this:**

```
/update-mailing-list
```

or:

- "Who's on our email list?"
- "How many subscribers do we have?"
- "Add the people from this sign-up sheet to the mailing list."
- "Take this person off the list."

**Adding people — what actually happens.**

**You do not need to tidy the spreadsheet.** Give it the file exactly as it was
exported. It works out which column is which and reads its guess back to you in
plain English:

```
I read attendees.csv — 84 rows. I think:
  Email            ← column "Attendee Email"        (84/84 look like emails)
  First name       ← column "Attendee First Name"   (84/84 filled)
  Order status     ← column "Order Status"          (81 completed, 3 refunded → will exclude)
  Marketing opt-in ← column "Can we email you about future events?"  (52 yes)
Is that right? Reply "yes", or tell me which one is wrong.
```

Reply "yes", or correct the one it got wrong. That is the whole job.

**The consent question.** Before it adds anyone it will ask **where and when
these people agreed** to receive email, and offer four options:

1. They filled in the newsletter sign-up form on the website
2. They ticked a box on an event registration form *(you must name the event and
   the date)*
3. They signed a paper sheet at an event that said so *(you must confirm the
   sheet actually said so)*
4. They asked us directly to add them

**If none of those is true, it will refuse, and it is right to.** The alternative
it offers is better anyway: send those people a link and let them subscribe
themselves.

**What it shows you before writing anything:**

```
New          : 52    Already present: 3    Unsubscribed (will NOT re-add): 1
Excluded     : 24 (no opt-in tick) · 3 (malformed) · 1 (suppression list)
Writes to    : Resend only. Nothing is written to the database.
```

**A note on "unsubscribed".** If somebody previously unsubscribed, this skill
will never put them back, no matter what the spreadsheet says. That is not
negotiable and not a setting.

**Removing someone.** Say "take `name@example.com` off the list". It records the
address in a scrambled form that can be checked against but never read back, so
the do-not-contact record can live safely in the project.

---

### 5.3 `/send-event-emails` — email the people coming to an event

**What it does.** Sends one of four stage emails to everyone who registered for a
specific event.

| Stage | When | Typically contains |
|---|---|---|
| `welcome` | Right after they register | Confirmation, date, venue, add-to-calendar |
| `week-before` | About a week out | Reminder, agenda, transport and parking |
| `day-before` | The day before | Room number or joining link, who to contact |
| `thank-you` | The day after | Thanks, feedback form, photos |

**Before you start, two things:**

1. **The event must already be on the website.** If it isn't, run
   `/sync-event-from-slack` first (section 5.6). The skill takes the date, venue
   and times from the website so the email cannot contradict it.
2. **A registrant list exported from Humanitix.** In Humanitix, export the
   attendees for that event and **make sure the export includes the attendee
   email column** — without it there is nobody to send to. Save the file into the
   `tmp` folder inside the project.

**Say this:**

```
/send-event-emails
```

or:

- "Remind everyone coming to the workshop tomorrow."
- "Send the room number to the people who registered for the AUT hackathon."
- "The event's finished — send a thank-you and ask for feedback."
- "给报名的人发个提醒"

**What it will ask you:** which event (it reads the name back with the date and
venue — **check that**), which stage, the practical detail only you know (the
room number, the joining link, the feedback form address), and a test mailbox.

**Why the sending is chunked.** Email services limit how fast you can send, so it
goes out in batches of up to 100 with a pause between them. It records each batch
as it completes. **If something fails halfway, run it again** — it picks up from
where it stopped and will not email anyone twice. It will tell you it's resuming:

```
RESUMING — chunks 2..3 of 3, 81 recipients already emailed will be skipped
```

**It will automatically leave out:** refunded and cancelled orders, duplicate
email addresses, anyone on the do-not-contact list, and anyone who already got
this stage. It reports each exclusion with its reason.

**What it will not do.** Anything promotional. Telling registrants about the
*next* event is marketing, not event logistics, and needs their separate consent
— so it will hand you over to `/update-mailing-list` and `/email-the-community`
instead. Again: the refusal is the tool working.

---

### 5.4 `/email-the-community` — one announcement to the whole list

**What it does.** Sends a single announcement to everyone on the mailing list, as
a proper broadcast with a working unsubscribe link.

**This is the highest-risk skill in the set,** because it reaches the most people
and cannot be recalled once delivered. It therefore has an extra confirmation
step compared with the others.

**Before you start:** the mailing list needs people on it. If it holds fewer than
five contacts, the skill will stop and ask whether you want to build the list
first — take that seriously.

**Say this:**

```
/email-the-community
```

or:

- "Email everyone about the new mentoring round."
- "Let the subscribers know applications are open."
- "给邮件名单发个通知"

**What it will ask you:** which group (segment) to send to, the subject line, the
main message, whether there's a photo, what the button says and where it goes,
when to send, and a test mailbox.

**Writing the message.** Give it the substance and let it write:

> "Mentoring applications are open again. The round starts in September and
> applications close on the 30th of August. Button should go to the mentoring
> page."

Rules it will hold you to, because they are what make an email get read:

- Subject line: 50 characters or fewer
- Preview text: 120 characters or fewer, and it must add something rather than
  repeat the subject
- **One** button. Two calls to action means neither gets clicked.

**The four-step confirmation.** This one is deliberately slower:

1. It shows you the email as a file you can open in your browser
2. It sends a test to the mailbox you named — check it on a phone too
3. It shows you the plan and waits
4. It creates the announcement as a **draft**, shows you the draft, and only then
   schedules it

**Scheduling gives you an escape hatch.** It schedules at least an hour ahead by
default. Until that moment arrives, a scheduled announcement can still be
cancelled — just say "cancel that broadcast". Once it has gone out, it is gone.

---

### 5.5 `/monthly-newsletter` — the monthly newsletter

**What it does.** Walks through one month's newsletter: pulls the automatically
prepared draft, helps you write the human parts, adds the month's real event
photos, previews it, sends a test, and schedules it.

**A heads-up on difficulty.** This skill needs more setup than the others —
including a video-processing tool for the photo step. **If you only do the
newsletter occasionally, do it alongside someone who has run it before, at least
the first time.**

**Say this:**

```
/monthly-newsletter
```

or "let's do this month's newsletter", "review the newsletter draft".

**What it will ask you for.** The parts a machine cannot write: the founder's
note, which photo goes on the cover, the photo of the month with a caption naming
the venue, and the subject line.

**The one rule to remember.** Each issue has a machine part (events, statistics,
photo strip) and a human part (the founder's note, the cover, the subject line).
Regenerating the draft refreshes the machine part but **must never overwrite the
human part**. If you have written the founder's note and something offers to
"start over", say no.

**Photos matter more than words here.** An issue is carried by real photographs
of real events. The skill has a step that collects them for you. Do not skip it.

---

### 5.6 `/sync-event-from-slack` — put an event on the website

**What it does.** Reads the Slack channel where an event is being planned and
turns it into a page on the She Sharp website — dates, venue, speakers, speaker
photos, the poster, all of it — without anyone downloading and renaming images by
hand.

**Say this:**

```
/sync-event-from-slack
```

or:

- "Sync the AUT LinkedIn event from Slack."
- "Update the event page from the planning channel."
- "Create the new event from Slack."

**What it will show you.** A plan listing every file it wants to download, every
field it wants to change, and — importantly — a `Redactions:` line naming
anything it deliberately left out. **Read that line carefully here.** Planning
channels contain registration codes and private links, and anything published to
the website is public permanently, including in the project's history.

**It does not change anything until you say "apply".**

**When you'd use it.** Whenever event details change, and always before running
`/send-event-emails` for that event — that skill takes its dates and venue from
the website, so the website has to be right first.

---

## 6. When something goes wrong

### "I typed `/` and my skill isn't in the list"

- Check Cursor has the **`she-sharp` folder itself** open, not the folder above
  it. Look at the file list: you should see `app`, `components`, `lib`.
- Close and reopen Cursor — skills are discovered at startup.
- Make sure Part C finished. If `git clone` failed, there is no project yet.

### "It says `resend` is not found"

The Resend tool isn't installed or isn't visible. In the terminal:

```
npm install -g resend-cli
```

Then close the terminal, open a new one, and try `resend --version` again.

### "It says DATABASE_URL is missing"

The `.env` file is missing, in the wrong folder, or has the wrong name. It must
sit next to `package.json` and be named exactly `.env`. If you never received
one, ask an admin (Part E).

### "It refused to send and I don't understand why"

Read the message — it explains itself. The most common one is:

> Blocked: cannot send a marketing email to Tier 2 — event registrants…

That means you asked it to send promotional content to people who only agreed to
hear about the specific thing they signed up for. **This is the tool working
correctly.** Either reword the email so it is genuinely about the thing they
registered for, or use `/update-mailing-list` to invite them to subscribe first.

### "The email failed halfway through sending"

Run the same skill again. It knows who already received it and will resume. **Do
not** start over from the beginning, and do not use `--force` unless someone
experienced tells you to.

### "I sent something wrong"

- **Scheduled but not yet sent:** say "cancel that broadcast" straight away. This
  is exactly why it schedules an hour ahead.
- **Already delivered:** it cannot be recalled. Tell the team, and if it needs a
  correction, send a short, plain follow-up. Don't try to hide it.

### "It's asking me something I don't know the answer to"

Say so — "I don't know, what do you suggest?" It will explain the options and
recommend one. If it is a decision only a person can make (whether a message is
junk, whether people actually consented), it will keep asking, and it should.

### Nothing here matches

Say to the assistant: **"Something went wrong — explain what happened in plain
words and what my options are."** It has access to the error and can translate
it. If it is a real problem with the tools, it will say so, and that is worth
passing to a developer.

---

## 7. Words you'll see

| Word | What it means |
|---|---|
| **Repo / repository** | The project's folder of files — the thing you copied in Part C |
| **Terminal** | The text window where you type commands. Not dangerous; it just doesn't have buttons |
| **CSV** | A spreadsheet saved as plain text. Excel and Google Sheets both export it |
| **Segment** | A named group of people in Resend, e.g. "Newsletter Pilot". A broadcast goes to a segment |
| **Topic** | What someone can unsubscribe *from*, so they can leave one thing without leaving everything |
| **Broadcast** | One email to a whole segment, with an unsubscribe link |
| **Transactional email** | An email to a specific person about something they did — a reply, a booking confirmation. No unsubscribe link, because they asked for it |
| **Dry run** | A practice run that shows what would happen without doing it |
| **Gate** | An automatic check that stops a send if something's wrong — too big, broken link, unreadable image |
| **Redactions** | Things the assistant deliberately left out of an email, listed so you can overrule it |
| **Suppression list** | People who must never be emailed again. Stored scrambled, so it holds no readable addresses |
| **Resend** | The service that actually delivers our email |
| **Humanitix** | Where people buy tickets to our events. The registrant list is exported from there |

---

## Getting help

- **Something about a skill:** ask in the chat — "explain what this step does",
  "why did it refuse?"
- **Missing access, keys, or the `.env` file:** ask an admin.
- **Something looks broken in the tools:** copy the error message and pass it to
  a developer. Copying the exact text matters more than describing it.

**And the thing worth repeating:** you cannot break anything by looking. Running
a skill to see what it says changes nothing. Every irreversible step waits for
you to say yes.
