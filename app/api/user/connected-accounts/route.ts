import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { accounts, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface ConnectedAccount {
  provider: string;
  providerAccountId: string;
  type: string;
  email?: string;
  connectedAt?: string;
}

/**
 * GET /api/user/connected-accounts
 * Returns OAuth accounts connected to the user.
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get connected OAuth accounts
    const connectedAccounts = await db
      .select({
        provider: accounts.provider,
        providerAccountId: accounts.providerAccountId,
        type: accounts.type,
      })
      .from(accounts)
      .where(eq(accounts.userId, user.id));

    // Format response with provider display names
    const formattedAccounts: ConnectedAccount[] = connectedAccounts.map(account => ({
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      type: account.type,
      email: user.email || undefined,
    }));

    // Check if user has a password set (for determining auth method)
    const hasPassword = !!user.passwordHash;

    return NextResponse.json({
      accounts: formattedAccounts,
      hasPassword,
      providers: formattedAccounts.map(a => a.provider),
    });
  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connected accounts' },
      { status: 500 }
    );
  }
}
