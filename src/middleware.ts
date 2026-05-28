import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Protect admin paths
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!token) {
      // Not logged in: redirect to login or home
      return NextResponse.redirect(new URL("/", request.url));
    }

    const role = token.role as string;
    if (role !== "owner" && role !== "admin") {
      // Forbidden: redirect to home or return JSON if API
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ error: "Access Denied: Admin role required" }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
