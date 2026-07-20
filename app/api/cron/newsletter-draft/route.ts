import { NextRequest, NextResponse } from "next/server";

import { assembleAutoData } from "@/lib/newsletter/assemble";
import { hasDraft, saveDraft } from "@/lib/newsletter/drafts";
import { generateEditorial } from "@/lib/newsletter/generate";
import { getIssue } from "@/lib/newsletter/issues-registry";
import { sendDraftReviewNotifications } from "@/lib/newsletter/notify";
import { renderNewsletter } from "@/lib/newsletter/render";
import { issueIdFor, isDraftDay, lastThursdaySendAt } from "@/lib/newsletter/schedule";
import {
  issueIdSchema,
  newsletterIssueSchema,
  type NewsletterIssueData,
} from "@/lib/newsletter/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/newsletter-draft
 * Vercel Cron entry point. Schedule (vercel.json): "0 20 * * 1"
 *   = Monday 20:00 UTC = Tuesday 08:00 NZ (the draft day is the Tuesday before
 *   the last Thursday; `runJob` no-ops on any Tuesday that is not the draft day).
 * In production, requires Authorization: Bearer ${CRON_SECRET}.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
    }
    if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return runJob(false);
}

/**
 * POST /api/cron/newsletter-draft
 * Manual trigger. Accepts a CRON_SECRET bearer token or an admin session.
 * Body: { month?: "YYYY-MM", force?: boolean }.
 *   - month: generate for a specific issue instead of the current NZ month.
 *   - force: bypass the draft-day gate and the "already committed / staged" guards.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!(cronSecret && authHeader === `Bearer ${cronSecret}`)) {
    const { getUser } = await import("@/lib/db/queries");
    const { isUserAdmin } = await import("@/lib/auth/permissions");

    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    month?: string;
    force?: boolean;
  };

  return runJob(Boolean(body.force), body.month);
}

/**
 * Assembles, AI-drafts, stages, and notifies for one monthly issue.
 *
 * @param force When true, bypasses the draft-day gate and idempotency guards.
 * @param monthOverride Optional "YYYY-MM" issue id to generate instead of the
 *   current NZ month.
 */
async function runJob(force: boolean, monthOverride?: string) {
  const now = new Date();
  console.log("[cron] newsletter-draft invoked", {
    force,
    monthOverride: monthOverride ?? null,
    at: now.toISOString(),
  });

  try {
    if (!force && !isDraftDay(now)) {
      return NextResponse.json({
        skipped: true,
        reason: "Not the draft day (draft runs on the Tuesday before the last Thursday).",
      });
    }

    const issueId = monthOverride ?? issueIdFor(now);
    if (!issueIdSchema.safeParse(issueId).success) {
      return NextResponse.json(
        { error: `Invalid issue id: ${issueId} (expected "YYYY-MM")` },
        { status: 400 }
      );
    }

    const [year, month] = issueId.split("-").map(Number);

    // Idempotency: never overwrite a committed issue or a staged draft unless forced.
    if (!force) {
      if (getIssue(issueId) !== null) {
        return NextResponse.json({
          skipped: true,
          reason: `Issue ${issueId} is already committed to the repo.`,
        });
      }
      if (await hasDraft(issueId)) {
        return NextResponse.json({
          skipped: true,
          reason: `A draft for ${issueId} is already staged in Redis.`,
        });
      }
    }

    const auto = assembleAutoData(year, month);
    const editorial = await generateEditorial({ year, month, auto });

    const issue: NewsletterIssueData = newsletterIssueSchema.parse({
      id: issueId,
      meta: {
        status: "draft",
        generatedAt: now.toISOString(),
        broadcastId: null,
        scheduledAt: null,
      },
      editorial,
      auto,
    });

    const savedToRedis = await saveDraft(issue);
    const { html, sizeKb } = await renderNewsletter(issue, "preview");
    const sendAtUtc = lastThursdaySendAt(year, month);

    const { emailed, slacked } = await sendDraftReviewNotifications({
      issue,
      previewHtml: html,
      sizeKb,
      sendAtUtc,
      // When Redis staging failed, embed the raw JSON in the email so it is not lost.
      draftJsonFallback: savedToRedis ? undefined : JSON.stringify(issue, null, 2),
    });

    console.log("[cron] newsletter-draft generated", {
      issueId,
      sizeKb: Number(sizeKb.toFixed(1)),
      redis: savedToRedis,
      emailed,
      slacked,
    });

    return NextResponse.json({
      generated: issueId,
      sizeKb: Number(sizeKb.toFixed(1)),
      emailed,
      slacked,
      redis: savedToRedis,
    });
  } catch (error) {
    console.error("Newsletter draft cron failed:", error);
    return NextResponse.json(
      {
        error: "Newsletter draft generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
