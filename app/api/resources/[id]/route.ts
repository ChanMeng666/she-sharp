import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { resources, adminPermissions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { withRoles, type AuthedRouteContext } from '@/lib/auth/role-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id);

    if (isNaN(resourceId)) {
      return NextResponse.json(
        { error: 'Invalid resource ID' },
        { status: 400 }
      );
    }

    // Get resource
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const user = await getUser();
    
    if (resource.accessLevel !== 'public' && !user) {
      return NextResponse.json(
        { error: 'Authentication required to access this resource' },
        { status: 401 }
      );
    }

    // Increment view count if user is authenticated
    if (user) {
      await db
        .update(resources)
        .set({
          viewCount: sql`${resources.viewCount} + 1`,
        })
        .where(eq(resources.id, resourceId));
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

// NOTE: gated on the `admin_permissions.canManageContent` column read directly,
// where a MISSING row denies access. `withRoles`' `requiredAdminPermissions`
// treats a missing row as "all defaults granted", so the permission test stays
// in the handler and `withRoles` supplies the signed-in user only.
export const PUT = withRoles(
  {},
  async (request: NextRequest, { params, user }: AuthedRouteContext<{ id: string }>) => {
  try {
    // Check if user is admin
    const [adminRole] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.userId, user.id))
      .limit(1);
    
    if (!adminRole || !adminRole.canManageContent) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const resourceId = parseInt(id);

    if (isNaN(resourceId)) {
      return NextResponse.json(
        { error: 'Invalid resource ID' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Update resource
    const [updatedResource] = await db
      .update(resources)
      .set({
        ...data,
        lastUpdated: new Date(),
      })
      .where(eq(resources.id, resourceId))
      .returning();

    if (!updatedResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Resource updated successfully',
      resource: updatedResource,
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
});

export const DELETE = withRoles(
  {},
  async (_request: NextRequest, { params, user }: AuthedRouteContext<{ id: string }>) => {
  try {
    // Check if user is admin
    const [adminRole] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.userId, user.id))
      .limit(1);
    
    if (!adminRole || !adminRole.canManageContent) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const resourceId = parseInt(id);

    if (isNaN(resourceId)) {
      return NextResponse.json(
        { error: 'Invalid resource ID' },
        { status: 400 }
      );
    }

    // Delete resource (access logs will cascade delete)
    await db.delete(resources).where(eq(resources.id, resourceId));

    return NextResponse.json({
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
});