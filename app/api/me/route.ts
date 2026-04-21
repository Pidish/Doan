import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)

    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: result.payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ data: user })

  } catch (error) {
    console.error("GET /api/me error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// PATCH /api/me
// Cập nhật profile
export async function PATCH(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)

    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, bio, avatar } = await req.json()

    const user = await prisma.user.update({
      where: { id: result.payload.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(avatar !== undefined && { avatar: avatar || null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ data: user })

  } catch (error) {
    console.error("PATCH /api/me error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
