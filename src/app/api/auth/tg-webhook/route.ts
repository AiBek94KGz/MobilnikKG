import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, authCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

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

        // 1. Mark code as verified in the DATABASE (Cross-instance support)
        try {
          await db.insert(authCodes).values({
            code: rawCode,
            username: username,
            telegramId: tgUser.id.toString(),
            firstName: firstName,
            status: "verified"
          }).onConflictDoUpdate({
            target: authCodes.code,
            set: {
              username: username,
              telegramId: tgUser.id.toString(),
              firstName: firstName,
              status: "verified"
            }
          });
        } catch (authErr: any) {
          console.error("Failed to save auth code in DB:", authErr.message);
        }

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
              userIndex: tgUser.id.toString(), 
              role: "client",
            });
          } else {
            // Update existing user with latest info
            console.log(`Updating existing user ${username} in DB`);
            await db.update(users).set({
              name: firstName,
              username: username,
              userIndex: tgUser.id.toString(), 
            }).where(eq(users.id, found[0].id));
          }
        } catch (dbErr: any) {
          console.log("⚠️ Webhook DB user sync error:", dbErr.message);
        }

        // 3. Send confirmation message to the user in Telegram
        const botToken = process.env.TELEGRAM_BOT_TOKEN || "8985263287:AAE6Kof_fKIT7k8c8FQQBkPc7sEV0ICb0Hs";
        const replyUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        await fetch(replyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tgUser.id,
            text: `🎉 <b>Вход выполнен успешно!</b>\n\nВы успешно вошли на сайт Mobilnik.KG.\n\n👤 Имя: <b>${firstName}</b>\n🆔 ID: <code>${tgUser.id}</code>\n\nВернитесь на вкладку сайта, вход произойдет автоматически.\n\n👇 <i>Для автоматического заполнения номера телефона при заказах, нажмите кнопку ниже:</i>`,
            parse_mode: "HTML",
            reply_markup: {
              keyboard: [[{ text: "📲 Поделиться номером телефона", request_contact: true }]],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }),
        }).catch(err => {
          console.error("Failed to send bot reply:", err);
        });
      }
    }

    // Handle Contact sharing
    if (message && message.contact) {
      const contact = message.contact;
      const tgId = contact.user_id.toString();
      const phone = contact.phone_number.startsWith("+") ? contact.phone_number : `+${contact.phone_number}`;

      console.log(`📱 Received phone number from TG: ${phone} for user ${tgId}`);

      try {
        await db.update(users).set({
          phone: phone
        }).where(eq(users.telegramId, tgId));

        const botToken = process.env.TELEGRAM_BOT_TOKEN || "8985263287:AAE6Kof_fKIT7k8c8FQQBkPc7sEV0ICb0Hs";
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: message.chat.id,
            text: `✅ <b>Номер телефона ${phone} привязан!</b>\n\nТеперь он будет автоматически подставляться при оформлении ваших заказов.`,
            parse_mode: "HTML",
            reply_markup: { remove_keyboard: true }
          }),
        });
      } catch (err) {
        console.error("Failed to update phone in DB:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("❌ Webhook error:", e.message);
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" });
  }
}
