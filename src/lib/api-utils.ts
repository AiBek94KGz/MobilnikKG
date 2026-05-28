import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getUserIdFromSession(session: any): Promise<number | null> {
  if (!session?.user) return null;
  
  const username = (session.user as any).username;
  if (!username) return null;

  const matchedUsers = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (matchedUsers.length > 0) {
    return matchedUsers[0].id;
  }
  return null;
}

export async function validateSession(allowedRoles: string[] = []) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  const role = (session.user as any).role;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session };
  }

  return { authorized: true, session, role };
}

export function formatTelegramOrderMessage({
  type,
  buyerName,
  buyerUsername,
  buyerPhone,
  itemsDescription,
  totalUsd,
  totalKGS,
}: {
  type: "order" | "preorder";
  buyerName: string;
  buyerUsername: string;
  buyerPhone: string;
  itemsDescription: string;
  totalUsd: number;
  totalKGS: number;
}) {
  const title = type === "order" ? "🔔 Новый Заказ!" : "🔔 Новый Предзаказ!";
  const typeLabel = type === "order" ? "Прямая продажа (В наличии)" : "Предзаказ (Из-за рубежа)";

  return `${title}
👤 Покупатель: <b>${buyerName}</b> (${buyerUsername} / ${buyerPhone})
📦 Товар: ${itemsDescription}
💰 Сумма: <b>$${totalUsd}</b> / <b>${totalKGS.toLocaleString("ru-RU")} сом</b>
📍 Тип: ${typeLabel}`;
}
