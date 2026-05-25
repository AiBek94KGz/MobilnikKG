import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch recent 10 orders to dynamically generate log layouts
    const recentOrders = await db
      .select({
        id: orders.id,
        totalUsd: orders.totalUsd,
        currencyUsed: orders.currencyUsed,
        exchangeRate: orders.exchangeRate,
        status: orders.status,
        deliveryType: orders.deliveryType,
        createdAt: orders.createdAt,
        user: {
          name: users.name,
          username: users.username,
          phone: users.phone,
        },
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.id))
      .limit(10);

    const logs = [];

    for (const order of recentOrders) {
      // Get items for this order
      const items = await db
        .select({
          quantity: orderItems.quantity,
          model: products.model,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      const itemsDesc = items
        .map((item) => `${item.model} x ${item.quantity}`)
        .join(", ");

      const totalKGS = Math.round(order.totalUsd * order.exchangeRate);
      const buyerName = order.user?.name || "Гость";
      const buyerPhone = order.user?.phone || "Нет телефона";
      const buyerUsername = order.user?.username ? `@${order.user.username}` : "Нет";

      let typeLabel = "Прямая продажа (В наличии)";
      if (order.deliveryType === "pre-order") {
        typeLabel = "Предзаказ";
      }

      const payload = `🔔 Новый Заказ / Предзаказ!
👤 Покупатель: <b>${buyerName}</b> (${buyerUsername} / ${buyerPhone})
📦 Товар: ${itemsDesc || "Устройство"}
💰 Сумма: <b>$${order.totalUsd}</b> / <b>${totalKGS.toLocaleString("ru-RU")} сом</b>
📍 Тип: ${typeLabel}`;

      logs.push({
        id: order.id,
        timestamp: order.createdAt,
        payload,
      });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Telegram Log API error:", error);
    return NextResponse.json({ error: "Failed to generate log history" }, { status: 500 });
  }
}
