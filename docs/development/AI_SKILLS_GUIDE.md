# Using She Sharp's AI Skills — a guide for everyone

**Who this is for:** anyone on the She Sharp team who needs to send email, add an
event to the website, or answer the people who write to us — **whether or not you
have ever written a line of code.**

You will not be writing code. You will be typing sentences into a chat box, and
an AI assistant will do the work while showing you exactly what it is about to do
and waiting for you to say yes.

**How long the one-time setup takes:** about an hour, once, and most of that is
waiting for downloads. After that, starting a task takes about ten seconds.

**You will not have to type a single command.** Everything in the setup below is
done by pasting a sentence into a chat box and letting the assistant do it. The
commands are printed underneath each step anyway, for the one time in twenty that
something needs doing by hand.

**The one thing to understand before you begin:** nothing is sent, and nothing is
changed, until you read a summary and explicitly approve it. Every skill in this
guide is built to stop and show you its plan first. If you ever feel unsure, you
can say "stop" or "show me that again" at any point.

---

## 1. What you'll be able to do

Ten skills live inside this project. Each one is a written procedure the AI
follows, so it does the task the same careful way every time.

**If you only remember one, remember `/run-event-playbook`.** It is the way in:
it works out where your event has got to and tells you which of the others to
run next, so you never have to hold the order in your head.

| Skill | What it does | Or just say | Who |
|---|---|---|---|
| `/run-event-playbook` | Works out where an event has got to and what comes next | *"what's left to do for Thursday's panel"* | anyone |
| `/make-event-poster` | The artwork — ticketing banner, social posts, print poster, one graphic per speaker | *"make a poster for the AUT night"* | Marketing |
| `/tweak-event-slides` | Changes one small thing on slides that already exist, and publishes it in about three minutes | *"fix the typo on the Les Mills deck"* | anyone |
| `/promote-event` | Tells the mailing list about an event that has not happened yet | *"tell the list about next month's event"* | Comms |
| `/email-the-community` | Sends one announcement to the whole mailing list | *"email everyone about the new mentoring round"* | Comms |
| `/update-mailing-list` | Shows who is on the mailing list, and adds people who agreed to join | *"who's on our email list?"* | Comms |
| `/reply-to-contact-messages` | Answers the people who filled in the contact form | *"who hasn't been replied to yet?"* | Comms |
| `/build-event-slides` | Builds the deck the room sees, at `/present/<event>` | *"build the deck for Thursday's panel"* | you decide the content, a developer operates it |
| `/monthly-newsletter` | Builds and schedules the monthly newsletter | *"build this month's newsletter"* | the website team |
| `/sync-event-from-slack` | Turns an event-planning Slack channel into a page on the website | post it in `#website-team` instead | the website team only — see 6.6 |

The table is ordered by who runs it: everything above `/build-event-slides` is
yours once you have finished section 2.

There is one job deliberately **not** in that table: emailing the people who
registered for an event. That is done in Humanitix, not here — section 6.3
explains why and how.

The email skills are where most people start. The event skills are here too,
because they are one toolkit and they depend on each other in a fixed order —
`/promote-event`, `/make-event-poster` and `/build-event-slides` all read the
date and venue from the website, so the event has to be on the website first.
Putting it there is `/sync-event-from-slack`, and that one skill is the website
team's job rather than yours — section 6.6 explains why, and what to do instead.
`/run-event-playbook` exists so you do not have to remember the order; the whole
order, with every gate and what goes wrong, is in
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

> **A note about asking for help.** Parts C, F and G need things only an admin
> can give you: access to the organisation on GitHub, the secrets file, and a
> sending key. That is normal and expected — it is not you doing something
> wrong, and it is not a queue you can skip by guessing.

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

### Part B — Let Cursor install the background tools

Four free tools have to be on your computer. They have no windows and you will
never open them; they work underneath. **You do not have to know what they are,
find them, or install them yourself.**

| Tool | What it is for |
|---|---|
| **Git** | Keeps a copy of the project on your computer, and sends your work back |
| **Node 22** | The thing the project actually runs on |
| **GitHub CLI** (`gh`) | Lets you propose your work to the team without opening a website |
| **Resend CLI** | What actually sends the email |

**Open Cursor's chat panel and paste this.** Change the first sentence if you are
on a Mac.

```
I'm setting up this project and I have never used a terminal before.

Please check whether git, node, gh and resend are installed on this Windows
machine, and install whatever is missing:
  - git and the GitHub CLI with winget
  - Node.js version 22 LTS specifically, not the newest version
  - resend with: npm install -g resend-cli

Tell me what you are about to run before you run it, do them one at a time, and
stop and tell me if something needs administrator rights so I can ask an admin.
```

On a Mac, replace the second paragraph's first line with *"…installed on this
Mac, and install whatever is missing using Homebrew (install Homebrew first if it
is not there)"*.

**It will show you each command before running it.** That is the assistant
working correctly. Say yes; if anything asks for an administrator password and
you do not have one, stop and ask an admin rather than guessing.

**Check it worked.** Paste this:

```
Check my setup: print the versions of git, node, gh and resend, and tell me
plainly which of them are missing. Don't install anything yet.
```

You want four version numbers, and `node` must start with **`v22`**. If it says
something else is installed, ask it to install 22 as well — this project is
tested against 22 and a newer one breaks the website build.

> **If the assistant cannot install something**, these are the manual downloads:
> Git <https://git-scm.com/downloads>, Node 22 LTS <https://nodejs.org>,
> GitHub CLI <https://cli.github.com>. The Resend tool is always
> `npm install -g resend-cli` in a terminal (**Terminal → New Terminal** in
> Cursor's top menu).

### Part C — Sign in to GitHub

GitHub is where the project lives. You need an account on it, and your account
needs to be in the **NZ-SheSharp** organisation — ask an admin to add you, using
whatever email address your GitHub account uses.

Once you are in, paste this into Cursor's chat:

```
Sign me in to GitHub from the terminal using the GitHub CLI. Walk me through it
one step at a time — tell me exactly what to click, and wait for me. Choose
HTTPS rather than SSH.
```

It will show you a short code, open a browser, and ask you to paste the code in.
That is normal and it only happens once.

**Check it worked.** Paste this:

```
Am I signed in to GitHub? Show me which account, and confirm I can reach the
NZ-SheSharp organisation.
```

If it says you cannot see NZ-SheSharp, you have not been added yet. That is an
admin job, not something you can fix — ask, and carry on with Part D when it is
done.

### Part D — Get the project onto your computer

First, pick somewhere simple for it to live — `Documents` is fine. In Cursor,
choose **File → Open Folder** and open that place. Then paste this into the chat:

```
Clone the NZ-SheSharp/she-sharp repository from GitHub into this folder, then
tell me the full path of the folder it created.
```

**Then open that folder itself.** Choose **File → Open Folder** again and open
the newly created **she-sharp** folder. This one matters and it is the most
common thing to get wrong: the tools only work when Cursor has the `she-sharp`
folder open, not the folder above it.

**Check it worked:** the file list on the left shows folders named `app`,
`components` and `lib`, and a file called `package.json`.

> If it says you do not have access, you have not been added to the
> **NZ-SheSharp** organisation yet — go back to Part C.

### Part E — Install the project's parts

```
Install this project's dependencies. Use pnpm version 10 exactly — run it as
`npx pnpm@10 install`, not plain `pnpm`. It will take a few minutes; tell me when
it has finished and whether it ended cleanly.
```

> **Why version 10 exactly?** Newer versions of pnpm change a file this project
> shares with its deployment system, which breaks the website build. Pinning to
> 10 avoids that. It costs you nothing.

**Check it worked:** a new `node_modules` folder appears in the file list, and
the assistant tells you it finished without errors.

### Part F — The secrets file

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

### Part G — Connect the Resend tool

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

Open the Cursor chat panel and paste this:

```
Check that I'm fully set up for this project, and don't change or send anything.
Confirm all of these and tell me plainly which are missing:
  - I have the she-sharp folder itself open, not its parent
  - git, node (v22), gh and resend are installed
  - I'm signed in to GitHub and can see the NZ-SheSharp organisation
  - node_modules exists
  - a .env file is present, and DATABASE_URL and SLACK_BOT_TOKEN are set in it
  - `resend whoami` says authenticated with full_access
Then list the skills available to me.
```

It will run the checks and tell you what is present and what is missing. Anything
missing is either one part of this setup you skipped, or something only an admin
can give you — take the message to them as it is written.

**When it lists the skills, you are done.** Section 3 is how to start one.

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

## 4. Getting your work into the project

Most of the skills write files — posters, slide decks, a record of what was sent.
Those files land **on your computer only**. This section is how they get to
everybody else. It is four sentences you paste into the chat, and you never have
to learn what any of them do underneath.

### The one idea to hold on to

You have a **copy** of the project. The live website is somewhere else.

```
your computer  →  you propose the change  →  someone reviews it  →  it goes live
   (a copy)          (a pull request)          (a teammate)        (~3 minutes)
```

**You cannot break the website from your computer.** Proposing a change is
exactly that — a proposal. Somebody looks at it before anything happens. The one
exception is on purpose and is named in the box at the end of this section.

### Which skills need this

| After you run… | Does anything need proposing? |
|---|---|
| `/make-event-poster` | **Yes** — the artwork files are new, and the website needs them |
| `/build-event-slides` | **Yes**, but the developer working with you does it |
| `/tweak-event-slides` | **No** — this one publishes itself, on purpose. See the box below |
| `/promote-event`, `/email-the-community`, `/update-mailing-list` | **Yes, but only the record.** The email has already gone; the project keeps a small note of what was sent to whom, and that note is worth sharing so nobody sends it twice |
| `/reply-to-contact-messages` | **Yes** — same, just the record |
| `/run-event-playbook` | **No** — it only reads |

### Step 1 — Look at what you changed

Before anything else, always:

```
What have I changed so far? Show me a plain-English list of the files and what
each change is. Don't commit anything yet.
```

Read it. If there is something in that list you did not expect — especially a
file with `.env`, `.csv` or somebody's name in it — stop and ask in
`#website-team` before going further.

### Step 2 — Propose it

```
I've finished the posters for the Les Mills event. Please put this on a new
branch, write a sensible commit message in the project's style, push it, and open
a pull request. Don't push to main. Show me the pull request link when it's done.
```

Change the first sentence to whatever you actually did. That is the whole trick:
**say what you did in your own words, and add "put it on a branch and open a pull
request".**

You will get a link back. Paste that link into `#website-team` so somebody knows
it is waiting.

### Step 3 — Nothing, until somebody merges it

A teammate reads it and merges it. The website updates about three minutes later.
If they ask for a change, say so in the chat — *"they want the date bigger, can
you redo it"* — and ask for it to be pushed to the same branch. The pull request
updates itself; you do not open a new one.

**If the pull request shows a red cross**, an automatic check has failed. That is
the project protecting itself, not you doing something wrong — the commonest one
is an image that was added but is not used anywhere yet. Paste the failure
message into the chat and ask *"what does this mean and can you fix it?"*. If it
is still red after one try, put the link in `#website-team` and leave it.

### Starting again tomorrow

Before you start any new piece of work:

```
Get the latest version of the project, and start me a fresh branch off main.
```

This matters more than it sounds. Working on top of a week-old copy is how two
people quietly overwrite each other.

### If it goes wrong

```
Something's not right. Undo everything I've changed since my last commit and put
the project back the way it was. Tell me what you're throwing away first.
```

Nothing is lost that matters — the artwork can be regenerated in a minute, and
the live website was never touched.

### Four things never to do

- **Never commit the `.env` file.** It holds the keys. The project is set up to
  ignore it; if the assistant ever offers to add it, say no and tell an admin.
- **Never commit a list of attendees, or any spreadsheet with people's email
  addresses in it.** Those belong in the `tmp/` folder, which is ignored on
  purpose, and they get deleted when you are done.
- **Never agree to "force push"**, and never agree to rewrite history. If you are
  offered either, the honest answer is *"I don't know, ask in #website-team"*.
- **Never push straight to `main`.** Always a branch, always a pull request. The
  one exception has its own skill, and it is the next box.

> **The one exception: `/tweak-event-slides`.**
> Changing a word on slides that already exist publishes itself, straight away,
> with no review and no undo button. That is deliberate — it exists for the hour
> before the doors open, when a speaker's title is wrong on the screen behind
> them. It is safe because it only ever changes **one small thing**: a word, a
> photograph, a name. Anything bigger than that goes back through
> `/build-event-slides` and a normal pull request.

### The commands, for the one time you need them

You should not have to type these. They are here so that nothing above is magic.

```
git status                      # what have I changed
git switch -c my-branch-name    # start a branch
git add -A                      # take everything
git commit -m "feat: …"         # save it, with a message
git push -u origin my-branch    # send it to GitHub
gh pr create --fill             # open the pull request
```

---

## 5. The golden rules

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

## 6. The skills, one by one

### 6.1 `/reply-to-contact-messages` — answer the people who wrote to us

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

### 6.2 `/update-mailing-list` — see and update who gets our email

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

### 6.3 Emailing the people coming to an event — **in Humanitix, not here**

**There is no skill for this, and that is deliberate.** Reminders, joining
details and thank-yous for the people who registered are sent from **Humanitix**,
in its own console, under **Email campaigns**. It is free on the charity rate the
organisation is on, and it already knows who bought a ticket — so there is
nothing to export, nothing to save into the project, and nothing to type here.

There used to be a `/send-event-emails` skill. It was removed on 2026-08-30
because it had never once been used to send anything, the team had been doing
this in Humanitix for a year, and the only list it could ever read was an export
from Humanitix — so it could not reach a single person Humanitix could not.

**How to do it.** In Humanitix, open the event → **Email campaigns** → write and
send. The audience is the ticket holders for that event; you choose nothing about
who is on it, which is the point.

| When | Typically contains |
|---|---|
| Right after they register | Confirmation, date, venue, add-to-calendar |
| About a week out | Reminder, agenda, transport and parking |
| The day before | Room number or joining link, who to contact |
| The day after | Thanks, feedback form, photos |

**Two emails about a two-hour evening is usually plenty** — one when they
register, one the day before. An email nobody asked for is not sent.

**Three things to know before you write one:**

1. **It will not come from `shesharp.org.nz`.** Humanitix always sends campaigns
   from its own email domain. You can change the *name* the email appears to come
   from, by applying a host profile to the event, but not the address. This is
   not something anyone here can configure; it is how the tool works, and the
   team has accepted it for a year.
2. **You have 14 days after the event, and then the tool stops.** Humanitix will
   only email an event that ended within the last two weeks. So send the
   thank-you **the day after**, not when the photos are finally ready — a
   fortnight later there is no way to reach those people at all.
3. **Nothing promotional.** Telling registrants about the *next* event is
   marketing, not event logistics, and needs their separate consent. Humanitix
   says the same from its side: campaigns are for service information about the
   ticket they bought, not for promotion. If you want to tell people about
   something new, that is `/update-mailing-list` and `/email-the-community`, and
   the list is only people who asked to be on it.

**The event still has to be right on the website first**, because the poster, the
slides and the announcement all read the date and venue from there — and because
you will be copying those details into Humanitix by hand. If it is wrong, fix it
through `#website-team` (section 6.6) before you write the email.

**None of this leaves a record in the project.** If someone asks whether the
reminder went out, the answer is in Humanitix's console, not in the repository —
`npx tsx scripts/events/event-status.ts` will say exactly that rather than guess.

---

### 6.4 `/email-the-community` — one announcement to the whole list

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

### 6.5 `/monthly-newsletter` — the monthly newsletter

**What it does.** Walks through one month's newsletter: creates the month's
issue file on your machine, helps you write it, adds the month's real event
photos, previews it, sends a test, and approves it for sending.

**A heads-up on difficulty.** This skill needs more setup than the others —
including a video-processing tool for the photo step. **If you only do the
newsletter occasionally, do it alongside someone who has run it before, at least
the first time.**

**Say this:**

```
/monthly-newsletter
```

or "let's do this month's newsletter", "start the newsletter for September".

**What it will ask you for.** The words. **Nothing writes the newsletter's copy
for you** — the founder's note, which photo goes on the cover, the photo of the
month with a caption naming the venue, and the subject line are all yours. There
used to be an AI first draft; it was rewritten by hand every month, so it was
removed. Expect the writing to be the work.

**The one rule to remember.** Each issue has a machine part (events, statistics,
photo strip) and a human part (the founder's note, the cover, the subject line).
Starting the month again rewrites the whole file, human part included. The
script refuses to do that to a file that already exists — if you have written
the founder's note and something offers to "start over", say no.

**Photos matter more than words here.** An issue is carried by real photographs
of real events. The skill has a step that collects them for you. Do not skip it.

---

### 6.6 `/sync-event-from-slack` — how an event gets onto the website

**This is the one skill in this guide you do not run.** It belongs to the website
team. What you do instead is one line in Slack, and this section is about getting
that line right.

**What it does.** Reads the Slack channel where an event is being planned and
turns it into a page on the She Sharp website — dates, venue, speakers, speaker
photos, the poster, all of it — without anyone downloading and renaming images by
hand.

**Why it is not yours to run.** Two reasons, and only the second is about
passwords.

1. **It moves two places at once.** The public website gets the event; a separate,
   private archive gets the record of the Slack conversation behind it. Those two
   have to stay level with each other, and they are kept level by one person so
   that “who read what, and when” always has an answer.
2. It needs a Slack token, and the archive holds things — attendee spreadsheets,
   live ticket codes, private messages — that must never reach a public website.

**What to do instead.** Post it in **`#website-team`**. That channel exists for
exactly this, and every message in it is read. Include four things:

- **Which event** — by name or date. “The Xero one in October”, not “the event”.
- **What should change**, in the words that should appear on the page.
- **The material**, attached — the headshot, the run sheet link, the document.
- **When you need it by.**

**Please do not send it as a direct message.** Website requests arrive in a
workspace of two hundred conversations and are found by looking for the signals of
an event — a venue, a date, a ticket link. “Please update Carolina’s profile on
the website” has none of those, so it scores zero and is invisible. It is not that
a DM is rude; it is that a DM gets lost. `#website-team` is where it will not.

**When it matters most.** Whenever event details change, and always before anyone
runs `/promote-event`, `/make-event-poster` or `/build-event-slides` for that
event. All three read the date and venue from the website, so the website has to
be right first.

The whole order, and who does which part, is on one page at
`/internal/event-playbook`, and in full in
`docs/development/EVENT_LIFECYCLE_SOP.md`.

---

## 7. When something goes wrong

### "I typed `/` and my skill isn't in the list"

- Check Cursor has the **`she-sharp` folder itself** open, not the folder above
  it. Look at the file list: you should see `app`, `components`, `lib`.
- Close and reopen Cursor — skills are discovered at startup.
- Make sure Part D finished. If cloning failed, there is no project yet.

### "It says `resend` is not found"

The Resend tool isn't installed or isn't visible. In the terminal:

```
npm install -g resend-cli
```

Then close the terminal, open a new one, and try `resend --version` again.

### "It says DATABASE_URL is missing"

The `.env` file is missing, in the wrong folder, or has the wrong name. It must
sit next to `package.json` and be named exactly `.env`. If you never received
one, ask an admin (Part F).

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

### "It says I don't have permission, or it can't find the repository"

Your GitHub account is not in the **NZ-SheSharp** organisation yet, or you are
signed in as a different account. Paste this:

```
Which GitHub account am I signed in as, and can I see the NZ-SheSharp
organisation? Don't change anything.
```

If it is the wrong account, ask it to sign you out and back in. If it is the
right account and the organisation is still not visible, an admin has to add you
— that is not something you or the assistant can fix.

### "It says my push was rejected"

Almost always because somebody else changed the same part of the project while
you were working. Paste this:

```
My push was rejected. Get the latest changes and rebase my branch on top of
them, then try again. If there is a conflict, stop and explain it to me in plain
English — don't guess at a resolution.
```

If it reports a conflict, that is a real decision about whose version wins.
Take it to `#website-team` rather than answering it yourself.

### "I've made a mess and I want to start over"

Nothing you have done locally has touched the live website, so this is always
safe:

```
Throw away everything I've changed since my last commit and put me back on an
up-to-date copy of main. List what you're discarding first so I can check.
```

The one thing worth rescuing first is anything you typed by hand — copy it out
before you run this. Generated files (posters, decks) can simply be made again.

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

## 8. Words you'll see

| Word | What it means |
|---|---|
| **Repo / repository** | The project's folder of files — the thing you copied in Part D |
| **Terminal** | The text window where you type commands. Not dangerous; it just doesn't have buttons |
| **CSV** | A spreadsheet saved as plain text. Excel and Google Sheets both export it |
| **Segment** | A named group of people in Resend, e.g. "Newsletter". A broadcast goes to a segment |
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
