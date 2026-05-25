import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Mock Session Provider",
      credentials: {
        email: { label: "Email", type: "text" },
        telegram: { label: "Telegram", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.email) {
          const emailClean = credentials.email.trim().toLowerCase();
          
          // Lookup user in SQLite database by email
          const found = await db
            .select()
            .from(users)
            .where(eq(users.email, emailClean))
            .limit(1);

          if (found[0]) {
            const user = found[0];
            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              username: user.username,
            };
          }

          // Not found: register new client user with this email
          const baseUsername = emailClean.split("@")[0];
          const newInserted = await db.insert(users).values({
            name: baseUsername,
            username: baseUsername,
            email: emailClean,
            role: "client",
          }).returning({ id: users.id });

          return {
            id: newInserted[0].id.toString(),
            name: baseUsername,
            email: emailClean,
            role: "client",
            username: baseUsername,
          };
        }

        if (credentials?.telegram) {
          const tgClean = credentials.telegram.trim().replace("@", "");
          
          // Lookup user in SQLite database by telegramId or username
          const found = await db
            .select()
            .from(users)
            .where(eq(users.telegramId, tgClean))
            .limit(1);

          if (found[0]) {
            const user = found[0];
            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email || `${user.username}@mobilnik.kg`,
              role: user.role,
              username: user.username,
            };
          }

          // Try checking by username
          const foundByUsername = await db
            .select()
            .from(users)
            .where(eq(users.username, tgClean))
            .limit(1);

          if (foundByUsername[0]) {
            const user = foundByUsername[0];
            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email || `${user.username}@mobilnik.kg`,
              role: user.role,
              username: user.username,
            };
          }

          // Not found: register new client user with this telegram handle
          const newInserted = await db.insert(users).values({
            name: tgClean,
            username: tgClean,
            telegramId: tgClean,
            role: "client",
          }).returning({ id: users.id });

          return {
            id: newInserted[0].id.toString(),
            name: tgClean,
            email: `${tgClean}@mobilnik.kg`,
            role: "client",
            username: tgClean,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "mobilnik-kg-secret-key-12345",
};
