# Slack Webhook Integration Guide

This guide walks through the complete process of setting up Slack Incoming Webhooks to send automated notifications from the She Sharp application. It covers creating a Slack App, configuring webhooks, setting environment variables, and the code implementation pattern used in this project.

---

## Table of Contents

1. [Overview](#overview)
2. [Step 1: Create a Slack App](#step-1-create-a-slack-app)
3. [Step 2: Enable Incoming Webhooks](#step-2-enable-incoming-webhooks)
4. [Step 3: Add a Webhook to a Channel](#step-3-add-a-webhook-to-a-channel)
5. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
6. [Step 5: Code Implementation](#step-5-code-implementation)
7. [Step 6: Integrate with Business Logic](#step-6-integrate-with-business-logic)
8. [Step 7: Testing](#step-7-testing)
9. [Cleaning Up Test Messages](#cleaning-up-test-messages)
10. [Troubleshooting](#troubleshooting)
11. [Message Formatting Reference](#message-formatting-reference)

---

## Overview

### What Are Incoming Webhooks?

Slack Incoming Webhooks are a simple way to post messages from external sources into Slack. They provide a unique URL that you send a JSON payload to, and Slack posts the message to the designated channel. No OAuth tokens, no bot users — just a URL and a POST request.

### Architecture in This Project

```
User submits form
  -> API route validates input
    -> Service layer saves to database
      -> Service layer awaits Slack notification
        -> Slack webhook delivers message to channel
  -> API returns success response
```

Key files:
- `lib/slack/service.ts` — Slack webhook service (sends formatted messages)
- `lib/forms/volunteer-service.ts` — Business logic that calls the Slack service
- `.env.local` / Vercel env vars — Webhook URL configuration

---

## Step 1: Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App**
3. Select **From scratch**
4. Fill in the details:
   - **App Name**: Choose a descriptive name (e.g., `She Sharp Notifications` or `ambassador-volunteer-application`)
   - **Workspace**: Select the Slack workspace where you want to receive notifications
5. Click **Create App**

You will be taken to the app's settings page (Basic Information).

---

## Step 2: Enable Incoming Webhooks

1. In the left sidebar of your app's settings, click **Incoming Webhooks**
2. Toggle the **Activate Incoming Webhooks** switch to **On**
3. You will see a section titled "Webhook URLs for Your Workspace" (initially empty)

---

## Step 3: Add a Webhook to a Channel

1. At the bottom of the Incoming Webhooks page, click **Add New Webhook to Workspace**
2. You will be prompted to select a channel:
   - Choose an existing channel (e.g., `#ambassador-and-volunteer-application`)
   - Or create a new channel first in Slack, then return here to select it
3. Click **Allow**
4. You will see a new Webhook URL generated, in this format:
   ```
   https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
   ```
5. **Copy this URL** — you will need it for the environment variable configuration

> **Tip**: You can add multiple webhooks pointing to different channels if needed. Each webhook URL is tied to a specific channel.

---

## Step 4: Configure Environment Variables

### Local Development (`.env.local`)

Add the webhook URL to your `.env.local` file:

```bash
# Slack Notifications
SLACK_VOLUNTEER_WEBHOOK_URL="https://hooks.slack.com/services/T.../B.../XXXX..."
```

### Vercel Production / Preview / Development

Use the Vercel CLI to set the environment variable. **Important**: Use `printf` instead of `echo` to avoid adding a trailing newline character to the value.

```bash
# Set for production
printf 'https://hooks.slack.com/services/T.../B.../XXXX...' | npx vercel env add SLACK_VOLUNTEER_WEBHOOK_URL production

# Set for preview
printf 'https://hooks.slack.com/services/T.../B.../XXXX...' | npx vercel env add SLACK_VOLUNTEER_WEBHOOK_URL preview

# Set for development
printf 'https://hooks.slack.com/services/T.../B.../XXXX...' | npx vercel env add SLACK_VOLUNTEER_WEBHOOK_URL development
```

> **Critical Warning — `echo` vs `printf`**
>
> Do NOT use `echo` to pipe values to `vercel env add`:
> ```bash
> # BAD - echo adds a trailing \n character to the env var value
> echo "https://hooks.slack.com/..." | npx vercel env add MY_VAR production
>
> # GOOD - printf does not add a trailing newline
> printf 'https://hooks.slack.com/...' | npx vercel env add MY_VAR production
> ```
> A trailing newline in the webhook URL will cause `fetch()` to fail silently or return errors. This applies to ALL environment variables set via pipe on Vercel, not just Slack webhooks.

### Verify Environment Variables

```bash
# List all env vars on Vercel
npx vercel env ls

# Filter for Slack-related vars
npx vercel env ls | grep -i slack
```

### Updating an Environment Variable

To update an existing variable, remove it first, then re-add:

```bash
npx vercel env rm SLACK_VOLUNTEER_WEBHOOK_URL production -y
printf 'https://hooks.slack.com/services/NEW_URL_HERE' | npx vercel env add SLACK_VOLUNTEER_WEBHOOK_URL production
```

> After changing environment variables on Vercel, you must **redeploy** for changes to take effect.

---

## Step 5: Code Implementation

### Slack Webhook Service (`lib/slack/service.ts`)

The service module handles message formatting and sending. Key design decisions:

1. **Graceful fallback** — If the webhook URL is not configured, the function returns silently without throwing
2. **`.trim()` on env var** — Defensive measure against trailing whitespace/newline in environment variables
3. **Error logging** — Failures are logged to server console but never surface to the end user

```typescript
// lib/slack/service.ts

interface NotificationData {
  title: string;
  fields: { label: string; value: string }[];
  sections?: { label: string; value: string }[];
}

export async function sendSlackNotification(data: NotificationData): Promise<void> {
  // Always .trim() env vars to guard against trailing newlines
  const webhookUrl = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping notification');
    return;
  }

  // Build Slack Block Kit message
  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: data.title, emoji: true },
    },
    {
      type: 'section',
      fields: data.fields.map(f => ({
        type: 'mrkdwn',
        text: `*${f.label}:*\n${f.value}`,
      })),
    },
  ];

  // Add optional text sections
  if (data.sections) {
    for (const section of data.sections) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*${section.label}:*\n${section.value}` },
      });
    }
  }

  blocks.push({ type: 'divider' });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      console.error('Slack webhook failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}
```

### Key Implementation Rules

#### 1. Always `await` the notification in serverless environments

```typescript
// BAD - fire-and-forget: the serverless function may exit before fetch completes
sendSlackNotification(data).catch(console.error);

// GOOD - await ensures the notification is sent before the function returns
try {
  await sendSlackNotification(data);
} catch (err) {
  console.error('Slack notification error:', err);
}
```

**Why?** Vercel Serverless Functions (and similar platforms like AWS Lambda) terminate the process as soon as the response is sent. If you use fire-and-forget, the `fetch()` call to Slack may not complete before the process is killed. Always `await` external HTTP calls.

#### 2. Never let Slack errors block the main operation

The `await` should be wrapped in a `try/catch` so that a Slack failure does not prevent the form submission from succeeding:

```typescript
// In your service layer:
const [submission] = await db.insert(table).values(data).returning();

// Slack notification - await but don't let it block success
try {
  await sendSlackNotification({ ... });
} catch (err) {
  console.error('Slack notification error:', err);
}

return { success: true, submissionId: submission.id };
```

#### 3. Always `.trim()` environment variables

```typescript
// Defensive against trailing \n from echo piping
const webhookUrl = process.env.SLACK_WEBHOOK_URL?.trim();
```

---

## Step 6: Integrate with Business Logic

### Example: Volunteer Form Submission

```typescript
// lib/forms/volunteer-service.ts
'use server';

import { db } from '@/lib/db/drizzle';
import { volunteerFormSubmissions } from '@/lib/db/schema';
import { sendVolunteerSlackNotification } from '@/lib/slack/service';

export async function submitVolunteerForm(data: FormData) {
  // 1. Save to database
  const [submission] = await db
    .insert(volunteerFormSubmissions)
    .values({ /* ... */ })
    .returning();

  // 2. Send Slack notification (await, but catch errors)
  try {
    await sendVolunteerSlackNotification({
      type: data.type,
      firstName: data.firstName,
      // ... other fields
    });
  } catch (err) {
    console.error('Slack notification error:', err);
  }

  // 3. Return success (regardless of Slack result)
  return { success: true, submissionId: submission.id };
}
```

### API Route Integration

```typescript
// app/api/forms/volunteer/public/route.ts
import { submitVolunteerForm } from '@/lib/forms/volunteer-service';

export async function POST(request: NextRequest) {
  const body = await request.json();
  // ... validate with Zod ...

  const result = await submitVolunteerForm(validatedData);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    submissionId: result.submissionId,
  });
}
```

---

## Step 7: Testing

### 1. Test the Webhook URL Directly

Use `curl` to verify your webhook URL works:

```bash
curl -X POST -H 'Content-Type: application/json' \
  --data '{"text":"Hello from She Sharp!"}' \
  https://hooks.slack.com/services/T.../B.../XXXX...
```

You should see the message appear in your Slack channel and `curl` should return `ok`.

### 2. Test Locally

1. Ensure `SLACK_VOLUNTEER_WEBHOOK_URL` is set in `.env.local`
2. Run `pnpm dev`
3. Submit a form on `/join-our-team/apply?type=ambassador`
4. Check the Slack channel for the notification

### 3. Test on Vercel

1. Ensure the env var is set on the appropriate Vercel environment
2. Deploy (push to GitHub or trigger manual deploy)
3. Submit a form on the deployed URL
4. Check the Slack channel
5. Check **Vercel Dashboard > Project > Logs** for any error messages

### 4. Best Practice: Use a Dedicated Test Channel

When testing Slack integrations, **always use a separate test channel** (e.g., `#test-notifications`) instead of the production channel. This avoids polluting production channels with test data and eliminates the need for cleanup afterward.

To set this up:
1. Create a test channel in Slack (e.g., `#test-notifications`)
2. Add a separate webhook pointing to the test channel
3. Use a different env var for testing, or override `SLACK_VOLUNTEER_WEBHOOK_URL` in `.env.local` with the test webhook URL
4. Switch to the production webhook URL only when deploying

---

## Cleaning Up Test Messages

### Why Cleanup Is Difficult

Messages sent via **Incoming Webhooks** have a different internal identity than messages sent by a Bot User. This creates significant limitations when trying to delete them programmatically:

- **Bot tokens (`xoxb-`)** can only delete messages that the bot itself posted via `chat.postMessage`. They **cannot** delete messages sent through Incoming Webhooks, even if the webhook belongs to the same Slack App.
- **User tokens (`xoxp-`)** with `chat:write` scope can delete messages, but **only if the user is a Workspace Owner or Admin**. Regular members receive the `cant_delete_message` error.

### How to Delete Webhook Messages

#### Option 1: Manual Deletion in Slack UI (Recommended)

The most reliable method is to delete messages manually in the Slack client:

1. Open the channel containing the test messages
2. Hover over each message and click the `...` (More actions) menu
3. Select **Delete message** and confirm

> **Note**: Only Workspace Owners, Admins, and the message author can see the "Delete message" option. If you don't see it, contact a workspace admin.

#### Option 2: API Deletion (Requires Admin Privileges)

If you need to delete messages programmatically (e.g., large-scale cleanup), you need:

1. **A Slack App with these Bot Token Scopes**:
   - `channels:history` — to read channel messages
   - `chat:write` — to attempt deletion

2. **A User OAuth Token (`xoxp-`)** with:
   - `chat:write` scope under **User Token Scopes**
   - The installing user must be a **Workspace Owner or Admin**

3. **The bot must be in the channel**:
   - Invite the bot with `/invite @bot-name` in the channel
   - Without this, the API returns `not_in_channel`

4. **Dual-token approach** (bot reads, user deletes):
   ```javascript
   // Use bot token to fetch message history (has channels:history)
   const history = await slackApi('conversations.history', {
     channel: CHANNEL_ID,
     limit: 100,
   }, botToken);

   // Use user token to delete each message (needs admin privileges)
   for (const msg of history.messages) {
     await slackApi('chat.delete', {
       channel: CHANNEL_ID,
       ts: msg.ts,
     }, userToken);
   }
   ```

### Common Errors During Cleanup

| Error | Cause | Solution |
|-------|-------|----------|
| `missing_scope` | Token lacks required OAuth scope | Add the missing scope in App settings → OAuth & Permissions, then reinstall the app |
| `not_in_channel` | Bot has not been added to the channel | Run `/invite @bot-name` in the Slack channel |
| `cant_delete_message` | Token lacks permission to delete that message | Use a User OAuth Token from a Workspace Owner/Admin, or delete manually in the UI |

### Lessons Learned

- **Incoming Webhook messages and Bot messages are different entities** in Slack's system, even when they belong to the same App. Plan your cleanup strategy accordingly.
- **Test in a dedicated channel** to avoid the need for production cleanup entirely.
- **Rotate any tokens** that have been shared or exposed during debugging. Reinstalling the Slack App generates new tokens automatically.

---

## Troubleshooting

### Notification Not Appearing in Slack

| Symptom | Cause | Fix |
|---------|-------|-----|
| No message, no error in logs | Env var not set or empty | Check `npx vercel env ls \| grep SLACK` |
| `SLACK_VOLUNTEER_WEBHOOK_URL not configured` in logs | Env var missing | Add the env var to Vercel |
| Slack webhook failed: 403 | Webhook URL revoked or app uninstalled | Regenerate the webhook in Slack App settings |
| Slack webhook failed: 404 | Webhook URL is incorrect | Verify the URL in Slack App settings |
| Slack webhook failed: 400 | Invalid message payload | Check Block Kit format at [Block Kit Builder](https://app.slack.com/block-kit-builder) |
| Works locally but not on Vercel | Env var has trailing newline | Use `printf` instead of `echo` when setting env vars, or add `.trim()` |
| DB saves but no Slack message | Fire-and-forget race condition | Change to `await sendSlackNotification(...)` |
| `missing_scope` from API call | Bot/User token lacks required OAuth scope | Add the scope in App settings → OAuth & Permissions, then reinstall |
| `not_in_channel` from API call | Bot not a member of the target channel | Invite the bot: `/invite @bot-name` in the Slack channel |
| `cant_delete_message` from `chat.delete` | Webhook messages require admin-level user token to delete | Use a User OAuth Token (`xoxp-`) from a Workspace Owner/Admin, or delete manually in UI |

### Checking Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Logs** in the left sidebar
4. Filter by the relevant function (e.g., `/api/forms/volunteer/public`)
5. Look for `console.error` entries containing "Slack"

### Verifying Environment Variables at Runtime

If you suspect env var issues, temporarily add this diagnostic code:

```typescript
const webhookUrl = process.env.SLACK_VOLUNTEER_WEBHOOK_URL;
console.log('Webhook URL debug:', {
  exists: !!webhookUrl,
  length: webhookUrl?.length,
  // Log char codes to detect invisible characters
  charCodes: webhookUrl ? [...webhookUrl.slice(-5)].map(c => c.charCodeAt(0)) : [],
});
```

The last character code should be a visible character (not `10` which is `\n` or `13` which is `\r`).

---

## Message Formatting Reference

### Simple Text Message

```typescript
const payload = { text: 'New application received!' };
```

### Block Kit Message (Rich Formatting)

```typescript
const payload = {
  blocks: [
    // Header
    {
      type: 'header',
      text: { type: 'plain_text', text: 'New Ambassador Application' },
    },
    // Fields (displayed in columns)
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: '*Name:*\nJane Doe' },
        { type: 'mrkdwn', text: '*Email:*\njane@example.com' },
      ],
    },
    // Full-width text section
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*Skills:*\nJavaScript, React, Python' },
    },
    // Link
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*CV:* <https://example.com/cv.pdf|Download CV>' },
    },
    // Divider
    { type: 'divider' },
  ],
};
```

### Markdown Formatting in Slack

| Syntax | Result |
|--------|--------|
| `*bold*` | **bold** |
| `_italic_` | _italic_ |
| `~strikethrough~` | ~~strikethrough~~ |
| `` `code` `` | `code` |
| `<https://url\|Display Text>` | [Display Text](https://url) |
| `\n` | Line break |

### Block Kit Builder

Use the [Slack Block Kit Builder](https://app.slack.com/block-kit-builder) to visually design and preview messages before implementing them in code.

### Block Types Summary

| Type | Purpose | Max per message |
|------|---------|----------------|
| `header` | Large bold title | 1 recommended |
| `section` | Text and/or fields | Unlimited |
| `divider` | Horizontal line | Unlimited |
| `image` | Inline image | Unlimited |
| `context` | Small muted text | Unlimited |
| `actions` | Buttons, menus | Unlimited |

> **Note**: A `section` block can have up to 10 `fields`, and each field can be up to 2000 characters.

---

## Adding a New Notification Type

To add Slack notifications for a different feature (e.g., event registrations):

1. **Add a new env var** (if using a different channel):
   ```bash
   printf 'https://hooks.slack.com/services/...' | npx vercel env add SLACK_EVENTS_WEBHOOK_URL production
   ```

2. **Create or extend the Slack service** (`lib/slack/service.ts`):
   ```typescript
   export async function sendEventRegistrationNotification(data: EventData): Promise<void> {
     const webhookUrl = process.env.SLACK_EVENTS_WEBHOOK_URL?.trim();
     if (!webhookUrl) return;
     // ... build and send message
   }
   ```

3. **Call from the service layer** with `await`:
   ```typescript
   try {
     await sendEventRegistrationNotification({ ... });
   } catch (err) {
     console.error('Event Slack notification error:', err);
   }
   ```

4. **Add the env var to `.env.example`**:
   ```bash
   SLACK_EVENTS_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
   ```

---

## Security Notes

- **Never commit webhook URLs** to version control. They are secrets.
- Webhook URLs are stored in `.env.local` (gitignored) and Vercel encrypted env vars.
- If a webhook URL is compromised, revoke it immediately in the Slack App settings and generate a new one.
- The `.env.example` file should only contain placeholder values, never real URLs.

### Token Types and When to Use Them

| Token Type | Prefix | Purpose | When Needed |
|------------|--------|---------|-------------|
| Incoming Webhook URL | `https://hooks.slack.com/...` | Send messages to a specific channel | Normal notification flow (this project's primary use case) |
| Bot User OAuth Token | `xoxb-` | Act as the bot: read channels, post messages | Only if you need Slack API access beyond simple webhooks |
| User OAuth Token | `xoxp-` | Act on behalf of a user: delete messages, manage channels | Only for admin operations like bulk message deletion |

### Token Rotation

- **Reinstalling the Slack App** regenerates both the Bot and User OAuth tokens automatically.
- **Rotate tokens immediately** if they have been exposed in logs, chat messages, or any communication channel.
- Webhook URLs can be revoked individually without reinstalling the app (go to Incoming Webhooks settings and click **Remove**).
