import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandParam = searchParams.get("brand");
  const statusParam = searchParams.get("status");
  const ownerParam = searchParams.get("owner");

  // Get active session
  const session = await getServerSession(authOptions);
  const isWholesale =
    session?.user &&
    ((session.user as any).role === "wholesale" ||
      (session.user as any).role === "owner");

  try {
    let queryConditions = [];

    if (ownerParam === "mine") {
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const role = (session.user as any).role;
      if (role !== "store_owner" && role !== "owner" && role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const ownerId = parseInt((session.user as any).id, 10);
      queryConditions.push(eq(products.ownerId, isNaN(ownerId) ? 2 : ownerId));
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
    const { brand, model, basePriceUsd, wholesalePriceUsd, stockQuantity, statusTag, imageUrl, description, isActive, batteryCapacity } = body;

    if (!brand || !model || basePriceUsd === undefined || wholesalePriceUsd === undefined || stockQuantity === undefined || !imageUrl || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["Apple", "Samsung", "Xiaomi", "Feature Phones"].includes(brand)) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 });
    }

    const sessionUserId = parseInt((session.user as any).id, 10);
    const ownerId = isNaN(sessionUserId) ? 2 : sessionUserId;

    const inserted = await db.insert(products).values({
      ownerId: ownerId,
      brand: brand as any,
      model,
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
    const { id, brand, model, basePriceUsd, wholesalePriceUsd, stockQuantity, statusTag, imageUrl, description, isActive, batteryCapacity } = body;

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

    if (role !== "owner" && role !== "admin" && found[0].ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
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

    if (role !== "owner" && role !== "admin" && found[0].ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
