import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { resources, adminPermissions } from '@/lib/db/schema';
import { eq, ilike, and, or, desc, asc, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { withRoles, type AuthedContext } from '@/lib/auth/role-middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const isPublic = searchParams.get('public');

    // Build query conditions
    const conditions = [];
    
    if (category) {
      conditions.push(sql`${resources.categories} @> ARRAY[${category}]::text[]`);
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(resources.title, `%${search}%`),
          ilike(resources.description, `%${search}%`)
        )
      );
    }
    
    // Filter by access level if needed
    // Note: isPublic field doesn't exist, using accessLevel instead

    // Get resources with access counts
    const resourcesQuery = db
      .select({
        id: resources.id,
        title: resources.title,
        description: resources.description,
        categories: resources.categories,
        resourceType: resources.resourceType,
        fileUrl: resources.fileUrl,
        fileSize: resources.fileSize,
        mimeType: resources.mimeType,
        // thumbnailUrl field doesn't exist
        accessLevel: resources.accessLevel,
        requiredRoles: resources.requiredRoles,
        // requiredMembershipTier field doesn't exist
        tags: resources.tags,
        averageRating: resources.averageRating,
        viewCount: resources.viewCount,
        downloadCount: resources.downloadCount,
        uploadedBy: resources.uploadedBy,
        uploadedAt: resources.uploadedAt,
        lastUpdated: resources.lastUpdated,
      })
      .from(resources);

    if (conditions.length > 0) {
      resourcesQuery.where(and(...conditions));
    }

    // Apply sorting
    if (sortBy === 'title') {
      resourcesQuery.orderBy(order === 'desc' ? desc(resources.title) : asc(resources.title));
    } else if (sortBy === 'viewCount') {
      resourcesQuery.orderBy(order === 'desc' ? desc(resources.viewCount) : asc(resources.viewCount));
    } else if (sortBy === 'downloadCount') {
      resourcesQuery.orderBy(order === 'desc' ? desc(resources.downloadCount) : asc(resources.downloadCount));
    } else {
      resourcesQuery.orderBy(order === 'desc' ? desc(resources.uploadedAt) : asc(resources.uploadedAt));
    }

    const allResources = await resourcesQuery;

    // Get user access permissions
    const user = await getUser();
    let userCanAccess = false;
    
    if (user) {
      // Check if user is member for members-only resources
      userCanAccess = true; // Simplified for now
    }

    // Filter resources based on access permissions
    const accessibleResources = allResources.filter(resource => {
      if (resource.accessLevel === 'public') return true;
      if (!user) return false;
      if (resource.accessLevel === 'member' && !userCanAccess) return false;
      return true;
    });

    // Group resources by category
    const categorizedResources = accessibleResources.reduce((acc, resource) => {
      const cat = (resource.categories && resource.categories[0]) || 'uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(resource);
      return acc;
    }, {} as Record<string, typeof accessibleResources>);

    // Get category counts
    const categoryCounts = Object.entries(categorizedResources).map(([category, items]) => ({
      category,
      count: items.length,
    }));

    return NextResponse.json({
      resources: accessibleResources,
      categories: categoryCounts,
      total: accessibleResources.length,
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// NOTE: gated on the `admin_permissions.canManageContent` column read directly,
// where a MISSING row denies access. `withRoles`' `requiredAdminPermissions`
// treats a missing row as "all defaults granted", so the permission test stays
// in the handler and `withRoles` supplies the signed-in user only.
export const POST = withRoles({}, async (request: NextRequest, { user }: AuthedContext) => {
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

    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.resourceType || !data.fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create resource
    const [newResource] = await db
      .insert(resources)
      .values({
        title: data.title,
        description: data.description,
        categories: data.categories || ['general'],
        resourceType: data.resourceType,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        // thumbnailUrl doesn't exist in schema
        accessLevel: data.accessLevel || 'member',
        requiredRoles: data.requiredRoles || [],
        // requiredMembershipTier doesn't exist
        tags: data.tags || [],
        // metadata doesn't exist in schema
        uploadedBy: user.id,
      })
      .returning();

    return NextResponse.json({
      message: 'Resource created successfully',
      resource: newResource,
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
});