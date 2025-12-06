import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { CustomDrizzleAdapter } from "@/lib/auth/custom-adapter";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { comparePasswords } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { validateOAuthEnv } from "@/lib/auth/validate-env";

// Validate environment on startup
const envValidation = validateOAuthEnv();
if (!envValidation.isValid) {
  console.error('OAuth Environment Configuration Errors:');
  envValidation.errors.forEach(error => console.error(`  - ${error}`));
}

const providers = [];

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  );
}

// Only add GitHub provider if credentials are configured
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// Always add Credentials provider
providers.push(
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, credentials.email as string))
        .limit(1);

      if (!user || !user.passwordHash) {
        return null;
      }

      const isValid = await comparePasswords(
        credentials.password as string,
        user.passwordHash
      );

      if (!isValid) {
        return null;
      }

      return {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerifiedAt,
      };
    }
  })
);

// Determine the correct URL based on environment
const getUrl = () => {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: CustomDrizzleAdapter(),
  providers,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true, // Important for production deployments
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days for "remember me"
  },
  pages: {
    signOut: "/",
    error: "/auth/error",
    verifyRequest: "/verify-email",
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, check if user with same email exists
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user.email) return false;
        
        // Check if a user with this email already exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        
        // If user exists, allow sign in (account will be linked automatically)
        // The allowDangerousEmailAccountLinking flag enables this
        return true;
      }
      
      // For credentials provider, check if email is verified
      if (account?.provider === "credentials") {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);
        
        // Allow sign in even if email not verified (we'll show warning in UI)
        return true;
      }
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      // For OAuth callbacks, redirect to verification page
      // The verification page will check if user needs to enter invitation code
      // or redirect to dashboard if already verified
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/verify-invitation`;
      }
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  events: {
    async signIn({ user, account }) {
      // Log sign in activity
      if (user?.id) {
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, parseInt(user.id)));
      }
    },
  },
  // Set to true to enable auth debug logs in development
  // debug: process.env.NODE_ENV === "development",
});