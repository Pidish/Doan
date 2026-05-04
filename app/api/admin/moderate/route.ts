import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'
import { moderateContent } from '@/lib/moderation'

// POST /api/admin/moderate — re-moderate a post by ID
export async function POST(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { id: result.payload.id } })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const moderation = await moderateContent(post.content)
    const newStatus = moderation.result === 'BLOCKED' ? 'BLOCKED'
      : moderation.result === 'WARNING' ? 'HIDDEN'
      : 'ACTIVE'

    const [updatedPost] = await prisma.$transaction([
      prisma.post.update({
        where: { id: postId },
        data: { status: newStatus as any, sentiment: moderation.sentiment as any }
      }),
      prisma.moderationLog.upsert({
        where: { postId },
        create: {
          postId,
          moderatorId: admin.id,
          authorId: post.authorId,
          content: post.content,
          result: moderation.result as any,
          reason: moderation.reason,
        },
        update: {
          result: moderation.result as any,
          reason: moderation.reason,
          moderatorId: admin.id,
        }
      })
    ])

    // Notify post author if WARNING or BLOCKED
    if (moderation.result !== 'SAFE') {
      const notifMessage = moderation.result === 'BLOCKED'
        ? `Bài viết của bạn đã bị chặn bởi admin: ${moderation.reason}`
        : `Bài viết của bạn đang chờ xét duyệt: ${moderation.reason}`
      await prisma.notification.create({
        data: {
          type: 'WARNING',
          message: notifMessage,
          userId: post.authorId,
          postId,
        }
      }).catch(() => {})
    }

    return NextResponse.json({ data: updatedPost, moderation })
  } catch (error) {
    console.error('Moderate error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
