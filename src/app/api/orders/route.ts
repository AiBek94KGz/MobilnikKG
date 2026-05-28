import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, users, stores } from "@/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendTelegramNotification } from "@/lib/telegram";

import { getUserIdFromSession, formatTelegramOrderMessage } from "@/lib/api-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = await getUserIdFromSession(session);

  if (role !== "owner" && role !== "admin" && role !== "store_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    let whereClause: any = undefined;

    if (role === "store_owner" && userId) {
      // Find stores owned by this user
      const userStores = await db.select({ id: stores.id }).from(stores).where(eq(stores.ownerId, userId));
      const storeIds = userStores.map(s => s.id);
      
      if (storeIds.length === 0) {
        return NextResponse.json({ orders: [] });
      }

      const orderIdsSubquery = db.select({ orderId: orderItems.orderId })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(products.storeId, storeIds));
      
      whereClause = inArray(orders.id, orderIdsSubquery);
    }

    const list = await db
      .select({
        id: orders.id,
        totalUsd: orders.totalUsd,
        currencyUsed: orders.currencyUsed,
        exchangeRate: orders.exchangeRate,
        status: orders.status,
        deliveryType: orders.deliveryType,
        createdAt: orders.createdAt,
        userName: users.name,
        userUsername: users.username,
        userPhone: users.phone,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        productBrand: products.brand,
        productModel: products.model,
        storeId: products.storeId,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(whereClause)
      .orderBy(desc(orders.id));

    const orderMap = new Map<number, any>();
    for (const row of list) {
      if (!orderMap.has(row.id)) {
        orderMap.set(row.id, {
          id: row.id,
          totalUsd: row.totalUsd,
          currencyUsed: row.currencyUsed,
          exchangeRate: row.exchangeRate,
          status: row.status,
          deliveryType: row.deliveryType,
          createdAt: row.createdAt,
          user: row.userName ? {
            name: row.userName,
            username: row.userUsername,
            phone: row.userPhone,
          } : null,
          itemParts: [],
        });
      }
      if (row.productModel) {
        orderMap.get(row.id).itemParts.push(`${row.productBrand} ${row.productModel} x${row.quantity}`);
      }
    }

    const formatted = Array.from(orderMap.values()).map(o => {
      const { itemParts, ...rest } = o;
      return {
        ...rest,
        items: itemParts.join(", ") || "Заказ устройства",
      };
    });

    return NextResponse.json({ orders: formatted });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || "client";
  const isWholesale = userRole === "wholesale" || userRole === "owner";

  try {
    const body = await request.json();
    const { cartItems, currencyUsed, exchangeRate } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Begin transaction-like manual sequence in SQLite
    let totalUsd = 0;
    const checkoutItems = [];

    for (const item of cartItems) {
      const foundProducts = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      const product = foundProducts[0];

      if (!product) {
        return NextResponse.json({ error: `Product ID ${item.productId} not found` }, { status: 400 });
      }

      if (product.stockQuantity < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for ${product.model}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
        }, { status: 400 });
      }

      const pricePaid = isWholesale ? product.wholesalePriceUsd : product.basePriceUsd;
      totalUsd += pricePaid * item.quantity;

      checkoutItems.push({
        product,
        quantity: item.quantity,
        pricePaid,
      });
    }

    // Decrement stock and save order
    const userIdValue = await getUserIdFromSession(session);

    const newOrder = await db.insert(orders).values({
      userId: userIdValue,
      totalUsd,
      currencyUsed,
      exchangeRate,
      status: "pending",
      deliveryType: "local",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    }).returning({ insertedId: orders.id });

    const orderId = newOrder[0].insertedId;

    // Save order items & decrement stock
    for (const item of checkoutItems) {
      await db.insert(orderItems).values({
        orderId,
        productId: item.product.id,
        quantity: item.quantity,
        pricePaidUsd: item.pricePaid,
      });

      await db
        .update(products)
        .set({
          stockQuantity: item.product.stockQuantity - item.quantity,
        })
        .where(eq(products.id, item.product.id));
    }

    // Prepare message summarizing purchase details for Telegram Bot alert
    const itemsDescription = checkoutItems
      .map((item) => `${item.product.model} x ${item.quantity}`)
      .join(", ");

    const buyerName = session?.user?.name || "Гость";
    const buyerPhone = matchedBuyerPhone(session?.user);
    const buyerUsername = (session?.user as any)?.username ? `@${(session?.user as any).username}` : "Нет";

    const totalKGS = Math.round(totalUsd * exchangeRate);
    const tgMsg = formatTelegramOrderMessage({
      type: "order",
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
    console.error("Checkout POST API error:", error);
    return NextResponse.json({ error: "Failed to process checkout" }, { status: 500 });
  }
}

function matchedBuyerPhone(user: any): string {
  if (!user) return "Нет телефона";
  return user.email && user.email.startsWith("+") ? user.email : "Нет телефона";
}
