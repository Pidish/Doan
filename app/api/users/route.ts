import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    })

    // ✅ Wrap trong { data: [...] } để đồng nhất
    return NextResponse.json({ data: users })

  } catch (error) {
    console.error("GET /api/users error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}