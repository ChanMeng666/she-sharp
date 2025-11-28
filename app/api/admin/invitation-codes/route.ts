import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { userRoles, adminPermissions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  createAdminCode,
  getInvitationCodes,
  revokeInvitationCode,
  getInvitationCodeStats,
} from '@/lib/invitations/service';

/**
 * Verifies if user has admin permissions.
 */
async function verifyAdminAccess(userId: number): Promise<boolean> {
  // Check if user has admin role
  const adminRole = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleType, 'admin'),
        eq(userRoles.isActive, true)
      )
    )
    .limit(1);

  return adminRole.length > 0;
}

/**
 * GET /api/admin/invitation-codes
 * List invitation codes with filtering and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await verifyAdminAccess(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'active' | 'used' | 'expired' | 'revoked' | null;
    const codeType = searchParams.get('codeType') as 'payment' | 'mentor_approved' | 'admin_generated' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const codes = await getInvitationCodes({
      status: status || undefined,
      codeType: codeType || undefined,
      limit,
      offset,
    });

    const stats = await getInvitationCodeStats();

    return NextResponse.json({
      codes,
      stats,
      pagination: { limit, offset },
    });
  } catch (error) {
    console.error('Error fetching invitation codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/invitation-codes
 * Create a new admin-generated invitation code.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await verifyAdminAccess(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { maxUses, expiresInDays, recipientEmail, notes } = body;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const code = await createAdminCode(user.id, {
      maxUses: maxUses || 1,
      expiresAt,
      recipientEmail,
      notes,
    });

    return NextResponse.json({ code }, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/invitation-codes
 * Revoke an invitation code.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await verifyAdminAccess(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { codeId, reason } = body;

    if (!codeId) {
      return NextResponse.json({ error: 'Code ID is required' }, { status: 400 });
    }

    const success = await revokeInvitationCode(codeId, user.id, reason);

    if (!success) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking invitation code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
