/**
 * Telegram Bot API Dispatcher Utility
 */

export async function sendTelegramNotification(message: string): Promise<{ success: boolean; error?: string; payload: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const responsePayload = {
    timestamp: new Date().toLocaleTimeString(),
    payload: message,
  };

  // If token is missing, log message in console and return success mock response
  if (!botToken || !chatId) {
    console.log("ℹ️ [Telegram Notification Simulation Logging] API environment keys missing.");
    console.log("Message Payload:\n", message);
    return {
      success: true,
      error: "Mock Mode: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables are empty.",
      payload: message,
    };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.description || `HTTP ${res.status}`);
    }

    return { success: true, payload: message };
  } catch (error: any) {
    console.error("❌ Telegram Bot Notification Dispatch failed:", error.message);
    return { success: false, error: error.message, payload: message };
  }
}
