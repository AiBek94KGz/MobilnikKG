import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, users, systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendTelegramNotification } from "@/lib/telegram";

import { getUserIdFromSession, formatTelegramOrderMessage } from "@/lib/api-utils";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || "client";
  const isWholesale = userRole === "wholesale" || userRole === "owner";

  try {
    const body = await request.json();
    const { productId, quantity, originHub, exchangeRate } = body;

    if (!productId || !quantity || !originHub) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const foundProducts = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    const product = foundProducts[0];

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Retrieve settings
    const settings = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.id, 1),
    });

    if (!settings) {
      return NextResponse.json({ error: "System settings not initialized" }, { status: 500 });
    }

    const itemPriceUsd = isWholesale ? product.wholesalePriceUsd : product.basePriceUsd;
    const shippingCostUnit =
      originHub === "dubai"
        ? settings.dubaiShippingCostUsd
        : settings.koreaShippingCostUsd;

    // Formula: Total = (Product Price * Qty) + (Shipping * Qty)
    const totalUsd = (itemPriceUsd * quantity) + (shippingCostUnit * quantity);
    const totalKGS = Math.round(totalUsd * exchangeRate);

    // Save order
    const userIdValue = await getUserIdFromSession(session);

    const newOrder = await db.insert(orders).values({
      userId: userIdValue,
      totalUsd,
      currencyUsed: body.currencyUsed || "USD",
      exchangeRate,
      status: "pending",
      deliveryType: "pre-order",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    }).returning({ insertedId: orders.id });

    const orderId = newOrder[0].insertedId;

    // Save order item
    await db.insert(orderItems).values({
      orderId,
      productId: product.id,
      quantity,
      pricePaidUsd: itemPriceUsd,
    });

    const buyerName = session?.user?.name || "Гость";
    const buyerPhone = session?.user?.email && session?.user?.email.startsWith("+") ? session?.user.email : "Нет телефона";
    const buyerUsername = (session?.user as any)?.username ? `@${(session?.user as any).username}` : "Нет";

    const itemsDescription = `${product.model} x ${quantity}`;
    const tgMsg = formatTelegramOrderMessage({
      type: "preorder",
      buyerName,
      buyerUsername,
      buyerPhone,
      itemsDescription,
      totalUsd,
      totalKGS,
    });

    const tgResult = await sendTelegramNotification(tgMsg);

    return NextResponse.json({
      success: true,
      orderId,
      totalUsd,
      telegramNotification: tgResult,
    });
  } catch (error) {
    console.error("Pre-order POST API error:", error);
    return NextResponse.json({ error: "Failed to process pre-order" }, { status: 500 });
  }
}
