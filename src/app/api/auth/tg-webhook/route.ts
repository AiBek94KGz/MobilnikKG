import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if it's a start command with a code: /start AUTH_XYZ
    const message = body.message;
    if (message && message.text && message.text.startsWith("/start AUTH_")) {
      const authCode = message.text.split(" ")[1]; // Get AUTH_XYZ
      const tgUser = message.from;
      const username = tgUser.username || `user_${tgUser.id}`;

      // Update or Create user with this authCode
      // Note: On Vercel this will be read-only for SQLite, 
      // so for the demo we'll use a trick or just focus on the flow.
      console.log(`✅ User ${username} started bot with code ${authCode}`);
      
      // In a real app with cloud DB, we would do:
      // await db.update(users).set({ authCode, telegramId: tgUser.id.toString() }).where(eq(users.username, username));
      
      // For the YOLO/Demo mode, we'll respond to the polling request.
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" });
  }
}
