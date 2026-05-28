import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, stores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { validateSession, getUserIdFromSession } from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    const { authorized, session, role, response } = await validateSession(["owner", "admin", "store_owner"]);
    if (!authorized) return response;

    const body = await request.json();
    const { productId, quantity, pricePaidUsd, exchangeRate } = body;

    if (!productId || !quantity || !pricePaidUsd || !exchangeRate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify product and ownership
    const found = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!found[0]) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const product = found[0];

    if (role === "store_owner") {
      const userId = await getUserIdFromSession(session);
      const userStores = await db.select({ id: stores.id }).from(stores).where(eq(stores.ownerId, userId || 0));
      const storeIds = userStores.map(s => s.id);
      if (!product.storeId || !storeIds.includes(product.storeId)) {
        return NextResponse.json({ error: "Forbidden: Not your product" }, { status: 403 });
      }
    }

    if (product.stockQuantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    // 2. Create Order (type in-store, status sold)
    const newOrder = await db.insert(orders).values({
      userId: null, // Manual sale, no customer account linked usually
      totalUsd: pricePaidUsd * quantity,
      currencyUsed: "USD",
      exchangeRate,
      status: "sold",
      deliveryType: "in-store",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    }).returning({ id: orders.id });

    const orderId = newOrder[0].id;

    // 3. Create Order Item
    await db.insert(orderItems).values({
      orderId,
      productId,
      quantity,
      pricePaidUsd,
    });

    // 4. Update Stock
    await db.update(products).set({
      stockQuantity: product.stockQuantity - quantity,
    }).where(eq(products.id, productId));

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
