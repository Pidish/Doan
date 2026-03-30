import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

// POST /api/follow
// Body: { followingId: string }
// Toggle follow/unfollow
export async function POST(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const followerId = result.payload.id
    const { followingId } = await req.json()

    if (!followingId) {
      return NextResponse.json({ error: "Missing followingId" }, { status: 400 })
    }

    if (followerId === followingId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Kiểm tra user được follow có tồn tại không
    const targetUser = await prisma.user.findUnique({ where: { id: followingId } })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Toggle follow/unfollow
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    })

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } })
      return NextResponse.json({ message: "Unfollowed", following: false })
    } else {
      await prisma.follow.create({ data: { followerId, followingId } })
      return NextResponse.json({ message: "Followed", following: true }, { status: 201 })
    }

  } catch (error) {
    console.error("POST /api/follow error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}