import { NextRequest, NextResponse } from "next/server";

import { getDraft } from "@/lib/newsletter/drafts";
import { issueIdSchema } from "@/lib/newsletter/schema";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/newsletter/draft/[month]
 *
 * Returns the Redis-staged draft for a "YYYY-MM" issue so the monthly Claude
 * Code skill (/monthly-newsletter) can pull it and write the repo fixture.
 *
 * Auth: a CRON_SECRET bearer token OR an admin session — the same dual pattern
 * as /api/cron/newsletter-draft, so the skill can authenticate headlessly.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ month: string }> }
) {
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

  const { month } = await params;
  if (!issueIdSchema.safeParse(month).success) {
    return NextResponse.json(
      { error: `Invalid month: ${month} (expected "YYYY-MM")` },
      { status: 400 }
    );
  }

  const draft = await getDraft(month);
  if (!draft) {
    return NextResponse.json(
      { error: `No staged draft found for ${month}` },
      { status: 404 }
    );
  }

  return NextResponse.json(draft);
}
