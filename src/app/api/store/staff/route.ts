import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "store_owner" && role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parentId = parseInt((session.user as any).id, 10);
    const staffList = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        telegramId: users.telegramId,
        phone: users.phone,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.parentId, parentId));

    return NextResponse.json({ staff: staffList });
  } catch (error: any) {
    console.error("Failed to fetch staff:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "store_owner" && role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parentId = parseInt((session.user as any).id, 10);
    const { name, username, password, telegramId, email, phone } = await request.json();

    if (!name || (!username && !telegramId)) {
      return NextResponse.json({ error: "Name and at least Username or Telegram ID are required" }, { status: 400 });
    }

    const cleanUsername = username ? username.trim().replace("@", "") : null;
    const cleanTgId = telegramId ? telegramId.toString().trim() : null;

    // Check for collisions
    if (cleanUsername) {
      const exists = await db.select().from(users).where(eq(users.username, cleanUsername)).limit(1);
      if (exists[0]) return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    
    if (cleanTgId) {
      const exists = await db.select().from(users).where(eq(users.telegramId, cleanTgId)).limit(1);
      if (exists[0]) return NextResponse.json({ error: "Telegram ID already associated with another account" }, { status: 400 });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const inserted = await db.insert(users).values({
      name: name.trim(),
      username: cleanUsername || `staff_${cleanTgId}`,
      telegramId: cleanTgId,
      email: email ? email.trim() : null,
      password: hashedPassword,
      phone: phone ? phone.trim() : null,
      role: "store_staff",
      parentId: parentId,
      userIndex: `S_${cleanUsername || cleanTgId}`,
    }).returning({ id: users.id });

    return NextResponse.json({ success: true, staffId: inserted[0].id });
  } catch (error: any) {
    console.error("Failed to create staff:", error);
    return NextResponse.json({ error: error.message || "Failed to create staff" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "store_owner" && role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    const staffId = parseInt(idParam, 10);
    const parentId = parseInt((session.user as any).id, 10);

    // Verify ownership
    const staffMember = await db
      .select()
      .from(users)
      .where(eq(users.id, staffId))
      .limit(1);

    if (!staffMember[0]) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Only owner/admin or the parent store owner can delete
    if (role !== "owner" && role !== "admin" && staffMember[0].parentId !== parentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(users).where(eq(users.id, staffId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete staff:", error);
    return NextResponse.json({ error: error.message || "Failed to delete staff" }, { status: 500 });
  }
}
