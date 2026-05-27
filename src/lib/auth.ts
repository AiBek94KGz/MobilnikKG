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
          
          // Lookup by telegramId, username, OR userIndex
          const found = await db
            .select()
            .from(users)
            .where(eq(users.telegramId, tgClean))
            .limit(1);

          let user = found[0];

          if (!user) {
            const foundByUsername = await db.select().from(users).where(eq(users.username, tgClean)).limit(1);
            user = foundByUsername[0];
          }
          
          if (!user) {
            const foundByIndex = await db.select().from(users).where(eq(users.userIndex, tgClean)).limit(1);
            user = foundByIndex[0];
          }

          if (user) {
            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email || `${user.username}@telegram.com`,
              role: user.role,
              username: user.username,
              userIndex: user.userIndex,
            };
          }

          // Not found: register new client user with 'C' index
          const newInserted = await db.insert(users).values({
            name: tgClean,
            username: tgClean,
            telegramId: tgClean,
            userIndex: `C${tgClean}`, // Auto-generate C-index for new clients
            role: "client",
          }).returning({ id: users.id });

          return {
            id: newInserted[0].id.toString(),
            name: tgClean,
            email: `${tgClean}@telegram.com`,
            role: "client",
            username: tgClean,
            userIndex: `C${tgClean}`,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.userIndex = (user as any).userIndex;
        token.parentId = (user as any).parentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).parentId = token.parentId;

        try {
          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.id, parseInt(token.id as string, 10)))
            .limit(1);

          if (dbUser[0]) {
            const u = dbUser[0];
            session.user.name = u.name;
            session.user.email = u.email;
            (session.user as any).username = u.username;
            (session.user as any).phone = u.phone;
            (session.user as any).userIndex = u.userIndex;
          } else {
            (session.user as any).username = token.username;
            (session.user as any).userIndex = token.userIndex;
          }
        } catch (e) {
          (session.user as any).username = token.username;
          (session.user as any).userIndex = token.userIndex;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "mobilnik-kg-secret-key-12345",
};
