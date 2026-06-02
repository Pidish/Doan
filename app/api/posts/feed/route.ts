import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth"
import { CategoryType } from "@prisma/client"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const cursor = searchParams.get("cursor")
    const category = searchParams.get("category")

    let take = Number(searchParams.get("take"))
    if (isNaN(take) || take <= 0 || take > 50) take = 10

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 })
    }

    const authResult = verifyAccessToken(req as import('next/server').NextRequest)
    const currentUserId = authResult.success ? authResult.payload.id : null

    // Posts from followed users + own posts
    const posts = await prisma.post.findMany({
      where: {
        status: 'ACTIVE',
        ...(category ? { category: category as CategoryType } : {}),
        OR: [
          // Bài của người mình đang follow
          { author: { followers: { some: { followerId: userId } } } },
          // Bài của chính mình
          { authorId: userId },
        ]
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        repost: { include: { author: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count: { select: { likes: true, comments: true, reposts: true } },
        ...(currentUserId ? { likes: { where: { userId: currentUserId }, select: { userId: true } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    let nextCursor: string | null = null
    if (posts.length > take) {
      const nextItem = posts.pop()
      nextCursor = nextItem?.id ?? null
    }

    const data = posts.map(p => {
      const { likes, ...rest } = p as typeof p & { likes?: { userId: string }[] }
      return { ...rest, isLiked: currentUserId ? (likes?.length ?? 0) > 0 : false }
    })

    return NextResponse.json({ data, nextCursor })
  } catch (error) {
    console.error("FEED ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
