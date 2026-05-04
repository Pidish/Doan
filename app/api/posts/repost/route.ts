import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

const REPOST_INCLUDE = {
  author: { select: { id: true, name: true, email: true, avatar: true } },
  _count: { select: { likes: true, comments: true, reposts: true } },
}

export async function POST(req: NextRequest) {
  try {
    const authResult = verifyAccessToken(req)
    if (!authResult.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = authResult.payload.id
    const { postId, caption } = await req.json()

    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    const original = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, status: true },
    })
    if (!original) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (original.status !== 'ACTIVE') return NextResponse.json({ error: 'Cannot repost this' }, { status: 400 })
    if (original.authorId === userId) return NextResponse.json({ error: 'Không thể repost bài của chính mình' }, { status: 400 })

    // Check already reposted
    const existing = await (prisma.post as any).findFirst({
      where: { authorId: userId, repostId: postId },
    })
    if (existing) return NextResponse.json({ error: 'Bạn đã repost bài này rồi' }, { status: 409 })

    const repost = await (prisma.post as any).create({
      data: {
        content: caption?.trim() || '',
        authorId: userId,
        repostId: postId,
        status: 'ACTIVE',
        category: 'DANH_CHO_BAN',
      },
      include: {
        ...REPOST_INCLUDE,
        repost: {
          include: {
            author: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    })

    // Notify original author
    if (original.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'LIKE',
          message: 'đã chia sẻ bài viết của bạn lên Nexora',
          userId: original.authorId,
          senderId: userId,
          postId,
        },
      }).catch(() => {})
    }

    return NextResponse.json({ data: repost }, { status: 201 })
  } catch (error) {
    console.error('Repost error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
