import { NextResponse } from "next/server";
import { tgAuthCodes } from "@/lib/auth-codes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code || !code.startsWith("AUTH_")) {
    return NextResponse.json({ success: false, error: "Invalid auth code format" }, { status: 400 });
  }

  // Retrieve code from cache
  const cachedSession = tgAuthCodes.get(code);

  if (!cachedSession) {
    // Register as pending session if it's the first check
    console.log(`⏳ Registering new pending session code: ${code}`);
    tgAuthCodes.set(code, {
      username: "",
      telegramId: "",
      firstName: "",
      status: "pending",
    });
    return NextResponse.json({ success: true, verified: false });
  }

  if (cachedSession.status === "verified") {
    console.log(`🎉 Polling matched verified session code: ${code} for username: ${cachedSession.username}`);
    
    // Clean up code after successful retrieval to prevent replay attacks
    tgAuthCodes.delete(code);

    return NextResponse.json({
      success: true,
      verified: true,
      username: cachedSession.username,
      telegramId: cachedSession.telegramId,
    });
  }

  // Session still pending
  return NextResponse.json({ success: true, verified: false });
}
