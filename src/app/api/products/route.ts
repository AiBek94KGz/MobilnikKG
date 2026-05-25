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

  // Get active session
  const session = await getServerSession(authOptions);
  const isWholesale =
    session?.user &&
    ((session.user as any).role === "wholesale" ||
      (session.user as any).role === "owner");

  try {
    let queryConditions = [];

    // Filter active items
    queryConditions.push(eq(products.isActive, true));

    // Optional filters
    if (brandParam && brandParam !== "all") {
      queryConditions.push(eq(products.brand, brandParam as any));
    }
    if (statusParam && statusParam !== "all") {
      queryConditions.push(eq(products.statusTag, statusParam as any));
    }

    const items = await db
      .select()
      .from(products)
      .where(and(...queryConditions));

    // Format products based on user session role
    const formatted = items.map((p) => {
      const price = isWholesale ? p.wholesalePriceUsd : p.basePriceUsd;
      const isRetail = !isWholesale;
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
      };
    });

    return NextResponse.json({ products: formatted });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
