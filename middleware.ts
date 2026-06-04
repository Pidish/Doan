import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, method } = request.nextUrl as { pathname: string; method?: string }
  const reqMethod = request.method

  // Allow public read-only access to posts (guest browsing)
  if (reqMethod === 'GET' && pathname.startsWith('/api/posts')) {
    return NextResponse.next()
  }

  const token = request.headers.get("authorization");
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/posts/:path*", "/api/me"],
};
