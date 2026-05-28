import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserIdFromSession } from "@/lib/api-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ orders: [] });
  }

  try {
    const list = await db
      .select({
        id: orders.id,
        totalUsd: orders.totalUsd,
        currencyUsed: orders.currencyUsed,
        exchangeRate: orders.exchangeRate,
        status: orders.status,
        deliveryType: orders.deliveryType,
        createdAt: orders.createdAt,
        productBrand: products.brand,
        productModel: products.model,
        quantity: orderItems.quantity,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.id));

    const orderMap = new Map<number, any>();
    for (const row of list) {
      if (!orderMap.has(row.id)) {
        orderMap.set(row.id, {
          ...row,
          itemParts: [],
        });
      }
      if (row.productModel) {
        orderMap.get(row.id).itemParts.push(`${row.productBrand} ${row.productModel} x${row.quantity}`);
      }
    }

    const formatted = Array.from(orderMap.values()).map(o => {
      const { itemParts, productBrand, productModel, quantity, ...rest } = o;
      return {
        ...rest,
        items: itemParts.join(", ") || "Заказ устройства",
      };
    });

    return NextResponse.json({ orders: formatted });
  } catch (error) {
    console.error("My Orders GET error:", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
