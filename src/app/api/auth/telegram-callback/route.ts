import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    data[key] = value;
  });

  const botToken = "8985263287:AAE6Kof_fKIT7k8c8FQQBkPc7sEV0ICb0Hs";
  
  // 1. Verify Telegram Hash
  const { hash, ...authData } = data;
  const checkString = Object.keys(authData)
    .sort()
    .map((key) => `${key}=${authData[key]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

  if (hmac !== hash) {
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }

  // 2. Find or Create User in DB (Handle Read-Only on Vercel)
  const tgId = data.id;
  const username = data.username || `user_${tgId}`;
  const firstName = data.first_name || "Telegram User";

  try {
    let user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      await db.insert(users).values({
        username: username,
        name: firstName,
        email: `${username}@telegram.com`,
        role: "client",
      });
    }
  } catch (e) {
    console.log("⚠️ Database is read-only (Vercel). Continuing with simulated session.");
  }

  // 3. Redirect back with success
  const response = NextResponse.redirect(new URL(`/?auth_success=true&username=${username}`, request.url));
  
  return response;
}
