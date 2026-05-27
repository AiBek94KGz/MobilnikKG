import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { tgAuthCodes } from "@/lib/auth-codes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  
  if (action === "setup") {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "8985263287:AAE6Kof_fKIT7k8c8FQQBkPc7sEV0ICb0Hs";
    const host = request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const webhookUrl = `${proto}://${host}/api/auth/tg-webhook`;
    
    try {
      console.log(`🤖 Setting up webhook for Bot: ${botToken.split(":")[0]}... to URL: ${webhookUrl}`);
      const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const result = await response.json();
      return NextResponse.json({ success: true, webhookUrl, telegramResponse: result });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message });
    }
  }
  
  return NextResponse.json({ status: "active", info: "Telegram Webhook Endpoint" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 Received TG Webhook Update:", JSON.stringify(body));

    const message = body.message;
    if (message && message.text && message.text.startsWith("/start")) {
      const parts = message.text.split(" ");
      const rawCode = parts[1]; // e.g. AUTH_XYZ
      
      if (rawCode && rawCode.startsWith("AUTH_")) {
        const tgUser = message.from;
        const username = tgUser.username || `user_${tgUser.id}`;
        const firstName = tgUser.first_name || "Telegram User";

        console.log(`✅ Telegram auth code received: ${rawCode} for user: ${username} (${tgUser.id})`);

        // 1. Mark code as verified in our global in-memory cache
        tgAuthCodes.set(rawCode, {
          username: username,
          telegramId: tgUser.id.toString(),
          firstName: firstName,
          status: "verified"
        });

        // 2. Try to sync/insert user in DB
        try {
          const found = await db
            .select()
            .from(users)
            .where(eq(users.telegramId, tgUser.id.toString()))
            .limit(1);

          if (!found[0]) {
            console.log(`Creating user record in DB for Telegram user ${username}`);
            await db.insert(users).values({
              name: firstName,
              username: username,
              telegramId: tgUser.id.toString(),
              userIndex: `C${tgUser.id}`,
              role: "client",
            });
          }
        } catch (dbErr: any) {
          console.log("⚠️ Database is read-only (Vercel) during webhook user registration. Continuing in-memory.", dbErr.message);
        }

        // 3. Send confirmation message to the user in Telegram
        const botToken = process.env.TELEGRAM_BOT_TOKEN || "8985263287:AAE6Kof_fKIT7k8c8FQQBkPc7sEV0ICb0Hs";
        const replyUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        await fetch(replyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tgUser.id,
            text: `🎉 <b>Вход выполнен успешно!</b>\n\nВы успешно вошли на сайт Mobilnik.KG под именем <b>@${username}</b>.\n\nВернитесь на вкладку сайта в браузере, вход произойдет автоматически.`,
            parse_mode: "HTML",
          }),
        }).catch(err => {
          console.error("Failed to send bot reply:", err);
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("❌ Webhook error:", e.message);
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" });
  }
}
