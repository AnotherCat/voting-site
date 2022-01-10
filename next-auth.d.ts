import NextAuth from "next-auth";
import JWT from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      name: string;
      image: string;
    };
  }
  interface Profile {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
    public_flags?: number;
    flags?: number;
    banner?: string | null;
    accent_color?: number | null;
    locale?: string;
    mfa_enabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
