import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"
import { moderateContent } from "@/lib/moderation"

// POST /api/posts
export async function POST(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = result.payload.id
    const body = await req.json()
    const content = body?.content?.trim()
    const imageUrl: string | undefined = body?.imageUrl || undefined

    if (!content && !imageUrl) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (content && content.length > 500) {
      return NextResponse.json({ error: "Content must be under 500 characters" }, { status: 400 })
    }

    const moderation = await moderateContent(content || '')
    const category = moderation.category

    const postStatus = moderation.result === 'BLOCKED' ? 'BLOCKED'
      : moderation.result === 'WARNING' ? 'HIDDEN'
      : 'ACTIVE'

    const post = await prisma.post.create({
      data: {
        content: content || '',
        imageUrl,
        status: postStatus as any,
        sentiment: moderation.sentiment as any,
        authorId: userId,
        category: category as any,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { likes: true, comments: true } }
      }
    })

    // Create moderation log + notification for non-safe content
    if (moderation.result !== 'SAFE') {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
      const notifMessage = moderation.result === 'BLOCKED'
        ? `Bài viết của bạn đã bị chặn: ${moderation.reason}`
        : `Bài viết của bạn đang chờ xét duyệt: ${moderation.reason}`

      await Promise.all([
        adminUser ? prisma.moderationLog.create({
          data: {
            postId: post.id,
            moderatorId: adminUser.id,
            authorId: userId,
            content,
            result: moderation.result as any,
            reason: moderation.reason,
          }
        }).catch(() => {}) : Promise.resolve(),
        prisma.notification.create({
          data: {
            type: 'WARNING',
            message: notifMessage,
            userId,
            postId: post.id,
          }
        }).catch(() => {}),
      ])
    }

    if (moderation.result === 'BLOCKED') {
      return NextResponse.json({
        error: 'Bài viết vi phạm tiêu chuẩn cộng đồng và không thể đăng.',
        reason: moderation.reason,
        blocked: true,
      }, { status: 422 })
    }

    return NextResponse.json({
      data: post,
      ...(moderation.result === 'WARNING' && { warning: moderation.reason })
    }, { status: 201 })

  } catch (error) {
    console.error("POST /api/posts error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// GET /api/posts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get("cursor")
    const category = searchParams.get("category")

    let take = Number(searchParams.get("take"))
    if (isNaN(take) || take <= 0 || take > 50) take = 10

    const authResult = verifyAccessToken(req)
    const userId = authResult.success ? authResult.payload.id : null

    const posts = await prisma.post.findMany({
      where: {
        status: "ACTIVE",
        ...(category && category !== 'DANH_CHO_BAN' && { category: category as any })
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        repost: { include: { author: { select: { id: true, name: true, email: true, avatar: true } } } },
        ...(userId && { likes: { where: { userId }, select: { userId: true } } }),
        _count: { select: { likes: true, comments: true, reposts: true } }
      }
    })

    let nextCursor: string | null = null
    if (posts.length > take) {
      const nextItem = posts.pop()
      nextCursor = nextItem?.id ?? null
    }

    const data = posts.map(p => {
      const { likes, ...rest } = p as typeof p & { likes?: { userId: string }[] }
      return { ...rest, isLiked: userId ? (likes?.length ?? 0) > 0 : false }
    })

    return NextResponse.json({ data, nextCursor })

  } catch (error) {
    console.error("GET /api/posts error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}