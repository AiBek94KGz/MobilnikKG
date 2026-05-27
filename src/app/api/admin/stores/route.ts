import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 1. Verify credentials and session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 2. Get all store owners
    const list = await db
      .select()
      .from(users)
      .where(eq(users.role, "store_owner"));

    // 3. Count products per owner
    const productCounts = await db
      .select({
        ownerId: products.ownerId,
        count: sql<number>`count(*)`,
      })
      .from(products)
      .groupBy(products.ownerId);

    // 4. Combine stores and product counts
    const stores = list.map((store) => {
      const matched = productCounts.find((pc) => pc.ownerId === store.id);
      return {
        id: store.id,
        name: store.name,
        username: store.username,
        phone: store.phone,
        email: store.email,
        userIndex: store.userIndex,
        telegramId: store.telegramId,
        createdAt: store.createdAt,
        productCount: matched ? matched.count : 0,
      };
    });

    return NextResponse.json({ success: true, stores });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Verify credentials and session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 2. Parse body
    const body = await request.json();
    const { name, username, phone, email } = body;

    if (!name || !username) {
      return NextResponse.json({ success: false, error: "Название и юзернейм обязательны" }, { status: 400 });
    }

    // 3. Generate unique userIndex starting with M + 9 random digits
    let userIndex = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      attempts++;
      const randomDigits = Math.floor(100000000 + Math.random() * 900000000); // 9 digits
      userIndex = `M${randomDigits}`;

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.userIndex, userIndex))
        .limit(1);

      if (existing.length === 0) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ success: false, error: "Не удалось сгенерировать уникальный индекс магазина" }, { status: 500 });
    }

    // 4. Create new store owner
    const newStore = await db
      .insert(users)
      .values({
        name: name.trim(),
        username: username.trim().replace("@", ""),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        userIndex,
        role: "store_owner",
      })
      .returning();

    return NextResponse.json({ success: true, store: newStore[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // 1. Verify credentials and session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 2. Parse body
    const body = await request.json();
    const { id, name, username, phone, email } = body;

    if (!id || !name || !username) {
      return NextResponse.json({ success: false, error: "ID, Название и юзернейм обязательны" }, { status: 400 });
    }

    // 3. Update store
    const updated = await db
      .update(users)
      .set({
        name: name.trim(),
        username: username.trim().replace("@", ""),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
      })
      .where(eq(users.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: "Магазин не найден" }, { status: 404 });
    }

    return NextResponse.json({ success: true, store: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Verify credentials and session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 2. Parse query param id
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get("id");
    if (!idStr) {
      return NextResponse.json({ success: false, error: "Не указан ID магазина" }, { status: 400 });
    }
    const id = parseInt(idStr, 10);

    // 3. Delete store products first
    await db.delete(products).where(eq(products.ownerId, id));

    // 4. Delete store owner
    const deleted = await db.delete(users).where(eq(users.id, id)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ success: false, error: "Магазин не найден" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
