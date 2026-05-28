import { NextResponse } from "next/server";
import { db } from "@/db";
import { authCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ success: false, error: "No code provided" }, { status: 400 });
  }

  // Check the DATABASE for the code status (Cross-instance support)
  const result = await db.select().from(authCodes).where(eq(authCodes.code, code)).limit(1);
  const cachedSession = result[0];

  if (cachedSession && cachedSession.status === "verified") {
    // 1. Success! Cleanup the code from DB (it's one-time use)
    await db.delete(authCodes).where(eq(authCodes.code, code));

    return NextResponse.json({
      success: true,
      verified: true,
      username: cachedSession.username,
      telegramId: cachedSession.telegramId,
    });
  }

  // Session still pending or not found
  return NextResponse.json({ success: true, verified: false });
}
