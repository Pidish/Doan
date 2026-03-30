import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bỏ qua public routes
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) return NextResponse.next();

  // Chỉ bảo vệ API routes
  if (!pathname.startsWith("/api")) return NextResponse.next();

  const result = verifyAccessToken(req);

  if (!result.success) {
    if (result.expired) {
      return NextResponse.json(
        { error: "Token expired", code: "TOKEN_EXPIRED" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: result.message, code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", result.payload.id);
  requestHeaders.set("x-user-email", result.payload.email);
  requestHeaders.set("x-user-username", result.payload.username);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/api/posts/:path*",
    "/api/follow/:path*",
    "/api/users/:path*",
    "/api/comments/:path*",
    "/api/feed/:path*",
    "/api/me/:path*",
  ],
};