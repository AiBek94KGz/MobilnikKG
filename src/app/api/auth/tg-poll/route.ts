import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // This is a simple mock endpoint to ensure the app doesn't crash
  return NextResponse.json({ success: true });
}
