import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

// GET /api/search?q=keyword
export async function GET(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const q = new URL(req.url).searchParams.get('q')?.trim()
    if (!q || q.length < 1) {
      return NextResponse.json({ users: [], posts: [] })
    }

    const [users, posts] = await Promise.all([
      prisma.user.findMany({
        where: {
          allowSearch: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { bio: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          _count: { select: { followers: true } },
        },
        take: 5,
      }),
      prisma.post.findMany({
        where: {
          status: 'ACTIVE',
          content: { contains: q, mode: 'insensitive' },
        },
        include: {
          author: { select: { id: true, name: true, avatar: true, email: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    return NextResponse.json({ users, posts })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
