import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, stores } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { validateSession } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const { authorized, response } = await validateSession(["owner", "admin"]);
    if (!authorized) return response;

    // 1. Get all stores with owner info
    const allStores = await db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        description: stores.description,
        logoUrl: stores.logoUrl,
        status: stores.status,
        createdAt: stores.createdAt,
        ownerId: stores.ownerId,
        ownerName: users.name,
        ownerUsername: users.username,
        ownerEmail: users.email,
        ownerPhone: users.phone,
      })
      .from(stores)
      .leftJoin(users, eq(stores.ownerId, users.id));

    // 2. Get product counts separately to avoid complex join issues
    const productCounts = await db
      .select({
        storeId: products.storeId,
        count: sql<number>`count(*)`,
      })
      .from(products)
      .groupBy(products.storeId);

    // 3. Merge data
    const formattedStores = allStores.map((s) => {
      const matched = productCounts.find((pc) => pc.storeId === s.id);
      return {
        ...s,
        productCount: matched ? Number(matched.count) : 0,
      };
    });

    console.log(`Successfully fetched ${formattedStores.length} stores`);
    return NextResponse.json({ success: true, stores: formattedStores });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { authorized, response } = await validateSession(["owner", "admin"]);
    if (!authorized) return response;

    const body = await request.json();
    const { name, username, phone, email, description, password } = body;

    if (!name || !username) {
      return NextResponse.json({ success: false, error: "Название и юзернейм обязательны" }, { status: 400 });
    }

    // 1. Check if user exists or create new store owner user
    let user;
    const existingUser = await db.select().from(users).where(eq(users.username, username.trim().replace("@", ""))).limit(1);
    
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    if (existingUser.length > 0) {
      user = existingUser[0];
      // Update role and password if needed
      const updateData: any = {};
      if (user.role !== "store_owner" && user.role !== "owner" && user.role !== "admin") {
        updateData.role = "store_owner";
      }
      if (hashedPassword) {
        updateData.password = hashedPassword;
      }
      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, user.id));
      }
    } else {
      // Generate userIndex
      let userIndex = "";
      let isUnique = false;
      while (!isUnique) {
        const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
        userIndex = `M${randomDigits}`;
        const checkIndex = await db.select().from(users).where(eq(users.userIndex, userIndex)).limit(1);
        if (checkIndex.length === 0) isUnique = true;
      }

      const insertedUser = await db.insert(users).values({
        name: name.trim(),
        username: username.trim().replace("@", ""),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        userIndex,
        role: "store_owner",
        password: hashedPassword,
      }).returning();
      user = insertedUser[0];
    }

    // 2. Create the store
    const slug = username.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);
    const newStore = await db.insert(stores).values({
      name: name.trim(),
      slug,
      ownerId: user.id,
      description: description || null,
      status: "active",
    }).returning();

    return NextResponse.json({ success: true, store: newStore[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { authorized, response } = await validateSession(["owner", "admin"]);
    if (!authorized) return response;

    const body = await request.json();
    const { id, name, description, status, logoUrl } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: "ID и Название обязательны" }, { status: 400 });
    }

    const updated = await db
      .update(stores)
      .set({
        name: name.trim(),
        description: description || null,
        status: status || "active",
        logoUrl: logoUrl || null,
      })
      .where(eq(stores.id, id))
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
    const { authorized, response } = await validateSession(["owner", "admin"]);
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get("id");
    if (!idStr) {
      return NextResponse.json({ success: false, error: "Не указан ID магазина" }, { status: 400 });
    }
    const id = parseInt(idStr, 10);

    // 1. Delete store products
    await db.delete(products).where(eq(products.storeId, id));

    // 2. Delete the store
    const deleted = await db.delete(stores).where(eq(stores.id, id)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ success: false, error: "Магазин не найден" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
