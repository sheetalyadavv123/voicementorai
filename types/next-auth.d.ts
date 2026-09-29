import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      preferredLanguage: string;
      difficultyLevel: string;
    } & DefaultSession["user"];
  }

  interface User {
    preferredLanguage: string;
    difficultyLevel: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    preferredLanguage: string;
    difficultyLevel: string;
  }
}
