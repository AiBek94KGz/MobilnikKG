import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

import { validateSession, getUserIdFromSession } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandParam = searchParams.get("brand");
  const statusParam = searchParams.get("status");
  const ownerParam = searchParams.get("owner");

  const { authorized, session, role } = await validateSession();
  const isWholesale = session?.user && 
    ((role === "wholesale") || (role === "owner"));

  try {
    let queryConditions = [];

    if (ownerParam === "mine") {
      if (!authorized || !session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (role !== "store_owner" && role !== "store_staff" && role !== "owner" && role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const userId = await getUserIdFromSession(session);
      if (!userId) return NextResponse.json({ products: [] });

      const parentId = (session.user as any).parentId;
      const effectiveOwnerId = role === "store_staff" ? parentId : userId;
      
      if (!effectiveOwnerId && role !== "owner" && role !== "admin") {
        return NextResponse.json({ products: [] });
      }

      // Find stores owned by the effective owner
      const userStores = await db.select({ id: stores.id }).from(stores).where(eq(stores.ownerId, effectiveOwnerId));
      const storeIds = userStores.map(s => s.id);
      
      if (storeIds.length === 0 && role !== "owner" && role !== "admin") {
        return NextResponse.json({ products: [] });
      }

      if (role === "owner" || role === "admin") {
         queryConditions.push(eq(products.ownerId, userId));
      } else {
         queryConditions.push(sql`${products.storeId} IN (${sql.join(storeIds, sql`, `)})`);
      }
    } else {
      // Filter active items for public view
      queryConditions.push(eq(products.isActive, true));

      // Optional filters
      if (brandParam && brandParam !== "all") {
        queryConditions.push(eq(products.brand, brandParam as any));
      }
      if (statusParam && statusParam !== "all") {
        queryConditions.push(eq(products.statusTag, statusParam as any));
      }
    }

    const items = await db
      .select()
      .from(products)
      .where(and(...queryConditions));

    // Format products based on user session role
    const formatted = items.map((p) => {
      const price = isWholesale ? p.wholesalePriceUsd : p.basePriceUsd;
      return {
        id: p.id,
        brand: p.brand,
        model: p.model,
        memory: p.memory,
        color: p.color,
        priceUsd: price,
        isWholesalePrice: isWholesale,
        basePriceUsd: p.basePriceUsd,
        wholesalePriceUsd: p.wholesalePriceUsd,
        stockQuantity: p.stockQuantity,
        statusTag: p.statusTag,
        imageUrl: p.imageUrl,
        description: p.description,
        isActive: p.isActive,
        batteryCapacity: p.batteryCapacity,
      };
    });

    return NextResponse.json({ products: formatted });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "owner" && role !== "admin" && role !== "store_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { brand, model, memory, color, basePriceUsd, wholesalePriceUsd, stockQuantity, statusTag, imageUrl, description, isActive, batteryCapacity, storeId } = body;

    if (!brand || !model || basePriceUsd === undefined || wholesalePriceUsd === undefined || stockQuantity === undefined || !imageUrl || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["Apple", "Samsung", "Xiaomi", "Huawei", "Honor", "Realme", "Tecno", "Infinix", "Poco", "Google", "OnePlus", "Feature Phones"].includes(brand)) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 });
    }

    const sessionUserId = parseInt((session.user as any).id, 10);
    
    // Find or verify storeId
    let finalStoreId = storeId ? parseInt(storeId, 10) : null;
    if (!finalStoreId) {
      const userStores = await db.select().from(stores).where(eq(stores.ownerId, sessionUserId)).limit(1);
      if (userStores.length > 0) {
        finalStoreId = userStores[0].id;
      }
    } else {
      // Verify user owns this store
      const verifyStore = await db.select().from(stores).where(and(eq(stores.id, finalStoreId), eq(stores.ownerId, sessionUserId))).limit(1);
      if (verifyStore.length === 0 && role !== "owner" && role !== "admin") {
        return NextResponse.json({ error: "Unauthorized store ID" }, { status: 403 });
      }
    }

    if (!finalStoreId && role !== "owner" && role !== "admin") {
       return NextResponse.json({ error: "Store required" }, { status: 400 });
    }

    const inserted = await db.insert(products).values({
      ownerId: sessionUserId,
      storeId: finalStoreId,
      brand: brand as any,
      model,
      memory: memory || null,
      color: color || null,
      basePriceUsd: parseInt(basePriceUsd, 10),
      wholesalePriceUsd: parseInt(wholesalePriceUsd, 10),
      stockQuantity: parseInt(stockQuantity, 10),
      statusTag: (statusTag || "all") as any,
      imageUrl,
      description,
      isActive: isActive !== undefined ? !!isActive : true,
      batteryCapacity: batteryCapacity !== undefined && batteryCapacity !== null ? parseInt(batteryCapacity, 10) : null,
    }).returning({ id: products.id });

    return NextResponse.json({ success: true, productId: inserted[0].id });
  } catch (error: any) {
    console.error("Failed to add product:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "owner" && role !== "admin" && role !== "store_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, brand, model, memory, color, basePriceUsd, wholesalePriceUsd, stockQuantity, statusTag, imageUrl, description, isActive, batteryCapacity } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const productId = parseInt(id, 10);
    const userId = parseInt((session.user as any).id, 10);

    // Check if product exists and verify ownership
    const found = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!found[0]) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let isAuthorized = role === "owner" || role === "admin";
    if (!isAuthorized) {
       // Check if user owns the store this product belongs to
       if (found[0].storeId) {
         const storeCheck = await db.select().from(stores).where(and(eq(stores.id, found[0].storeId), eq(stores.ownerId, userId))).limit(1);
         if (storeCheck.length > 0) isAuthorized = true;
       } else if (found[0].ownerId === userId) {
         isAuthorized = true;
       }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (memory !== undefined) updateData.memory = memory;
    if (color !== undefined) updateData.color = color;
    if (basePriceUsd !== undefined) updateData.basePriceUsd = parseInt(basePriceUsd, 10);
    if (wholesalePriceUsd !== undefined) updateData.wholesalePriceUsd = parseInt(wholesalePriceUsd, 10);
    if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity, 10);
    if (statusTag !== undefined) updateData.statusTag = statusTag;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = !!isActive;
    if (batteryCapacity !== undefined) updateData.batteryCapacity = batteryCapacity !== null ? parseInt(batteryCapacity, 10) : null;

    await db.update(products).set(updateData).where(eq(products.id, productId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "owner" && role !== "admin" && role !== "store_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const productId = parseInt(idParam, 10);
    const userId = parseInt((session.user as any).id, 10);

    // Check if product exists and verify ownership
    const found = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!found[0]) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let isAuthorized = role === "owner" || role === "admin";
    if (!isAuthorized) {
       // Check if user owns the store this product belongs to
       if (found[0].storeId) {
         const storeCheck = await db.select().from(stores).where(and(eq(stores.id, found[0].storeId), eq(stores.ownerId, userId))).limit(1);
         if (storeCheck.length > 0) isAuthorized = true;
       } else if (found[0].ownerId === userId) {
         isAuthorized = true;
       }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
