import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: "https://discord.com/api/oauth2/authorize?scope=identify",
    }),
    // ...add more providers here
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  jwt: {},
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.id = profile.id;
        token.name = `${profile.username}#${profile.discriminator}`;
      }
      return token;
    },
    async session({ session, token, user }) {
      session.user.id = token.id;
      return session;
    },
  },
});
