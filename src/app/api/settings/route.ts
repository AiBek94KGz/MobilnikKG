import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.id, 1))
      .limit(1);

    if (settings.length === 0) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error("Settings GET API error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { usdToKgsRate, dubaiShippingCostUsd, koreaShippingCostUsd } = body;

    if (
      isNaN(parseFloat(usdToKgsRate)) ||
      isNaN(parseFloat(dubaiShippingCostUsd)) ||
      isNaN(parseFloat(koreaShippingCostUsd))
    ) {
      return NextResponse.json({ error: "Invalid numeric parameters" }, { status: 400 });
    }

    await db
      .update(systemSettings)
      .set({
        usdToKgsRate: parseFloat(usdToKgsRate),
        dubaiShippingCostUsd: parseFloat(dubaiShippingCostUsd),
        koreaShippingCostUsd: parseFloat(koreaShippingCostUsd),
      })
      .where(eq(systemSettings.id, 1));

    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("Settings POST API error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
