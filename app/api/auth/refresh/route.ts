import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, generateAccessToken } from "@/lib/auth";

// POST /api/auth/refresh
// Body: { refreshToken: string }
export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    const result = verifyRefreshToken(refreshToken);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.expired
            ? "Session expired, please login again"
            : result.message,
          code: result.expired ? "SESSION_EXPIRED" : "INVALID_TOKEN",
        },
        { status: 401 }
      );
    }

    // Cấp access token mới
    const accessToken = generateAccessToken({
      id: result.payload.id,
      email: result.payload.email,
      username: result.payload.username,
    });

    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}