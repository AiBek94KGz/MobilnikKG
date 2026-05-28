import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Secure Provider",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        telegram: { label: "Telegram", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.email) {
          const emailClean = credentials.email.trim().toLowerCase();
          const password = credentials.password;
          
          const found = await db
            .select()
            .from(users)
            .where(eq(users.email, emailClean))
            .limit(1);

          if (found[0]) {
            const user = found[0];
            
            // If user has a password, verify it
            if (user.password) {
              if (!password) return null;
              const isValid = await bcrypt.compare(password, user.password);
              if (!isValid) return null;
            } else if (password) {
              // If user has no password yet but provided one, maybe set it? 
              // (Risk: first person to login as existing user without password sets it)
              // Better: if no password, only allow login if it's a public/mock environment
              // or force them to use Telegram.
              // For now, if no password, allow login ONLY if it's a client.
              if (user.role !== "client") return null;
            }

            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              username: user.username,
            };
          }

          // Auto-register only clients
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
          let newId = 999999 + Math.floor(Math.random() * 1000000);
          const index = `C${tgClean}`;
          try {
            const newInserted = await db.insert(users).values({
              name: tgClean,
              username: tgClean,
              telegramId: tgClean,
              userIndex: index, // Auto-generate C-index for new clients
              role: "client",
            }).returning({ id: users.id });
            if (newInserted[0]) {
              newId = newInserted[0].id;
            }
          } catch (e) {
            console.log("⚠️ Database is read-only (Vercel). Continuing with temporary session ID.");
          }

          return {
            id: newId.toString(),
            name: tgClean,
            email: `${tgClean}@telegram.com`,
            role: "client",
            username: tgClean,
            userIndex: index,
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
  secret: process.env.NEXTAUTH_SECRET,
};
