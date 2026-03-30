import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/follow/[userId]/followers
// Lấy danh sách người đang follow [userId]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            bio: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    const data = followers.map(f => f.follower)

    return NextResponse.json({ data, total: data.length })

  } catch (error) {
    console.error("GET /api/follow/[userId]/followers error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}