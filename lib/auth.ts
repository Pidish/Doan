import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomJwtPayload {
  id: string;
  email: string;
  username: string;
}

// ✅ SỬA: interface → type (interface không dùng = với union type)
export type TokenVerifyResult =
  | { success: true; payload: CustomJwtPayload }
  | { success: false; expired: boolean; message: string };

// ─── Helpers để lấy secret an toàn ───────────────────────────────────────────

function getAccessSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined in environment");
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not defined in environment");
  return secret;
}

// ─── Tạo Access Token (15 phút) ──────────────────────────────────────────────

export function generateAccessToken(payload: CustomJwtPayload): string {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: "15m" });
}

// ─── Tạo Refresh Token (7 ngày) ──────────────────────────────────────────────

export function generateRefreshToken(payload: CustomJwtPayload): string {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: "7d" });
}

// ─── Tạo cả hai token cùng lúc ───────────────────────────────────────────────

export function generateTokenPair(payload: CustomJwtPayload): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

// ─── Xác thực Access Token từ Request ────────────────────────────────────────

export function verifyAccessToken(req: NextRequest): TokenVerifyResult {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { success: false, expired: false, message: "No token provided" };
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return { success: false, expired: false, message: "Token malformed" };
    }

    const payload = jwt.verify(token, getAccessSecret()) as CustomJwtPayload;
    return { success: true, payload };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return { success: false, expired: true, message: "Token has expired" };
    }
    if (error instanceof JsonWebTokenError) {
      return { success: false, expired: false, message: "Token is invalid" };
    }
    return { success: false, expired: false, message: "Token verification failed" };
  }
}

// ─── Xác thực Refresh Token ──────────────────────────────────────────────────

export function verifyRefreshToken(token: string): TokenVerifyResult {
  try {
    const payload = jwt.verify(token, getRefreshSecret()) as CustomJwtPayload;
    return { success: true, payload };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return { success: false, expired: true, message: "Refresh token has expired" };
    }
    return { success: false, expired: false, message: "Refresh token is invalid" };
  }
}

// ─── Hash & so sánh password ─────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// ─── Lấy current user từ request ─────────────────────────────────────────────

export async function getCurrentUser(req: NextRequest) {
  const result = verifyAccessToken(req);
  if (!result.success) return null;

  const user = await prisma.user.findUnique({
    where: { id: result.payload.id },
    select: {
      id: true,
      email: true,
      name: true,      // ✅ SỬA: displayName → name (đúng với schema)
      avatar: true,    // ✅ SỬA: avatarUrl → avatar (đúng với schema)
      bio: true,
      role: true,      // ✅ THÊM: thường cần role để check quyền
    },
  });

  return user;
}