import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { mentorProfiles, mentorFormSubmissions, users, userRoles } from '@/lib/db/schema';
import { eq, and, ilike, or, sql, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const expertise = searchParams.get('expertise');
    const minExperience = searchParams.get('minExperience');
    const maxExperience = searchParams.get('maxExperience');
    const isAccepting = searchParams.get('isAccepting');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    
    // Only show mentors with active roles
    conditions.push(eq(userRoles.roleType, 'mentor'));
    conditions.push(eq(userRoles.isActive, true));
    
    // Filter by accepting mentees
    if (isAccepting === 'true') {
      conditions.push(eq(mentorProfiles.isAcceptingMentees, true));
    }
    
    // Filter by experience years
    if (minExperience) {
      conditions.push(gte(mentorProfiles.yearsExperience, parseInt(minExperience)));
    }
    if (maxExperience) {
      conditions.push(lte(mentorProfiles.yearsExperience, parseInt(maxExperience)));
    }

    // Add search filter to conditions
    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(mentorProfiles.bio, `%${search}%`),
          ilike(mentorProfiles.jobTitle, `%${search}%`),
          ilike(mentorProfiles.company, `%${search}%`),
          sql`${mentorProfiles.expertiseAreas}::text ILIKE ${'%' + search + '%'}`
        )
      );
    }
    
    // Add expertise filter to conditions
    if (expertise) {
      conditions.push(
        sql`${mentorProfiles.expertiseAreas} @> ARRAY[${expertise}]::text[]`
      );
    }

    // Get mentors with their user info and form submission data
    const rawMentors = await db
      .select({
        id: mentorProfiles.id,
        userId: mentorProfiles.userId,
        name: users.name,
        email: users.email,
        userImage: users.image,
        profilePhotoUrl: mentorProfiles.photoUrl,
        formPhotoUrl: mentorFormSubmissions.photoUrl,
        expertiseAreas: mentorProfiles.expertiseAreas,
        yearsExperience: mentorProfiles.yearsExperience,
        profileJobTitle: mentorProfiles.jobTitle,
        profileCompany: mentorProfiles.company,
        profileBio: mentorProfiles.bio,
        profileLinkedinUrl: mentorProfiles.linkedinUrl,
        formJobTitle: mentorFormSubmissions.jobTitle,
        formCompany: mentorFormSubmissions.company,
        formBio: mentorFormSubmissions.bio,
        formLinkedinUrl: mentorFormSubmissions.linkedinUrl,
        formYearsExperience: mentorFormSubmissions.yearsExperience,
        availabilityHoursPerMonth: mentorProfiles.availabilityHoursPerMonth,
        maxMentees: mentorProfiles.maxMentees,
        currentMenteesCount: mentorProfiles.currentMenteesCount,
        isAcceptingMentees: mentorProfiles.isAcceptingMentees,
        profileCompletedAt: mentorProfiles.profileCompletedAt,
        verifiedAt: mentorProfiles.verifiedAt,
      })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(mentorFormSubmissions, eq(mentorProfiles.userId, mentorFormSubmissions.userId))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(sql`COALESCE(${mentorFormSubmissions.yearsExperience}, ${mentorProfiles.yearsExperience}) DESC NULLS LAST`);

    // Apply form → profile → user fallback chain
    const mentors = rawMentors.map(m => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      email: m.email,
      image: m.formPhotoUrl || m.profilePhotoUrl || m.userImage || null,
      expertiseAreas: m.expertiseAreas,
      yearsExperience: m.formYearsExperience ?? m.yearsExperience,
      jobTitle: m.formJobTitle || m.profileJobTitle,
      company: m.formCompany || m.profileCompany,
      bio: m.formBio || m.profileBio,
      linkedinUrl: m.formLinkedinUrl || m.profileLinkedinUrl,
      availabilityHoursPerMonth: m.availabilityHoursPerMonth,
      maxMentees: m.maxMentees,
      currentMenteesCount: m.currentMenteesCount,
      isAcceptingMentees: m.isAcceptingMentees,
      profileCompletedAt: m.profileCompletedAt,
      verifiedAt: m.verifiedAt,
    }));

    // Get total count for pagination
    const countQuery = await db
      .select({ count: sql`COUNT(*)` })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(mentorFormSubmissions, eq(mentorProfiles.userId, mentorFormSubmissions.userId))
      .where(and(...conditions));

    const totalCount = Number(countQuery[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      mentors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentors' },
      { status: 500 }
    );
  }
}