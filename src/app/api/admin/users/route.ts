import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { validateSession } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const { authorized, response } = await validateSession(["owner", "admin"]);
    if (!authorized) return response;

    const list = await db
      .select()
      .from(users)
      .orderBy(desc(users.id));

    return NextResponse.json({ success: true, users: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { authorized, response } = await validateSession(["owner", "admin"]);
    if (!authorized) return response;

    const body = await request.json();
    const { id, name, role, phone, email, password } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json({ success: true, user: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { authorized, response } = await validateSession(["owner", "admin"]);
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // Prevent deleting yourself (the current admin)
    // For now simple delete
    await db.delete(users).where(eq(users.id, parseInt(id, 10)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
