import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 })
    }

    const authResult = verifyAccessToken(req as import('next/server').NextRequest)
    const currentUserId = authResult.success ? authResult.payload.id : null

    // Single query: posts from users that userId follows
    const posts = await prisma.post.findMany({
      where: {
        status: 'ACTIVE',
        author: { followers: { some: { followerId: userId } } }
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        repost: { include: { author: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count: { select: { likes: true, comments: true, reposts: true } },
        ...(currentUserId ? { likes: { where: { userId: currentUserId }, select: { userId: true } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const data = posts.map(p => {
      const { likes, ...rest } = p as typeof p & { likes?: { userId: string }[] }
      return { ...rest, isLiked: currentUserId ? (likes?.length ?? 0) > 0 : false }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("FEED ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
