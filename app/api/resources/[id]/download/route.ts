import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { resources, userMemberships } from '@/lib/db/schema';
import { eq, and, gte, isNull, or, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
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
    if (resource.accessLevel === 'public') {
      // Public resources are accessible to everyone
    } else if (resource.accessLevel === 'member') {
      if (!user) {
        return NextResponse.json(
          { error: 'Sign in required to download this resource' },
          { status: 401 }
        );
      }

      // Check if user has active membership
      const [membership] = await db
        .select()
        .from(userMemberships)
        .where(
          and(
            eq(userMemberships.userId, user.id),
            or(
              isNull(userMemberships.expiresAt),
              gte(userMemberships.expiresAt, new Date())
            )
          )
        )
        .limit(1);

      if (!membership) {
        return NextResponse.json(
          { error: 'Active membership required to download this resource' },
          { status: 403 }
        );
      }
    } else if (resource.accessLevel === 'premium') {
      if (!user) {
        return NextResponse.json(
          { error: 'Sign in required to download this resource' },
          { status: 401 }
        );
      }

      // Check if user has premium membership
      const [membership] = await db
        .select()
        .from(userMemberships)
        .where(
          and(
            eq(userMemberships.userId, user.id),
            eq(userMemberships.tier, 'premium'),
            or(
              isNull(userMemberships.expiresAt),
              gte(userMemberships.expiresAt, new Date())
            )
          )
        )
        .limit(1);

      if (!membership) {
        return NextResponse.json(
          { error: 'Premium membership required to download this resource' },
          { status: 403 }
        );
      }
    }

    // Check required roles if specified
    if (resource.requiredRoles && resource.requiredRoles.length > 0) {
      if (!user) {
        return NextResponse.json(
          { error: 'Sign in required to download this resource' },
          { status: 401 }
        );
      }

      // TODO: Check if user has any of the required roles
      // This would require querying the userRoles table
    }

    // Increment download count
    if (user) {
      await db
        .update(resources)
        .set({
          downloadCount: sql`${resources.downloadCount} + 1`,
        })
        .where(eq(resources.id, resourceId));
    }

    // Return download URL or redirect
    if (resource.fileUrl) {
      // If it's an external URL, redirect
      if (resource.fileUrl.startsWith('http')) {
        return NextResponse.redirect(resource.fileUrl);
      }
      
      // For local files, you would typically serve them from a storage service
      // For now, we'll just return the URL
      return NextResponse.json({
        downloadUrl: resource.fileUrl,
        fileName: resource.title,
        mimeType: resource.mimeType,
      });
    } else {
      return NextResponse.json(
        { error: 'Download URL not available' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error downloading resource:', error);
    return NextResponse.json(
      { error: 'Failed to download resource' },
      { status: 500 }
    );
  }
}