import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/follow/[userId]/following
// Lấy danh sách người mà [userId] đang follow
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

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
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

    const data = following.map(f => f.following)

    return NextResponse.json({ data, total: data.length })

  } catch (error) {
    console.error("GET /api/follow/[userId]/following error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
