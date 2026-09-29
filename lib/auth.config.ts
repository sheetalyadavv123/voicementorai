import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the auth config: no providers, no Prisma/bcrypt
// imports. Middleware runs on the Edge runtime and cannot bundle the
// Node-only Prisma client, so it only ever imports this file — never
// lib/auth.ts directly. The full config (with the Credentials provider)
// lives in lib/auth.ts and is only used by Node-runtime route handlers.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.preferredLanguage = user.preferredLanguage;
        token.difficultyLevel = user.difficultyLevel;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.preferredLanguage = token.preferredLanguage as string;
        session.user.difficultyLevel = token.difficultyLevel as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
