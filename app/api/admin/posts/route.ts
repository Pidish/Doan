import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const result = verifyAccessToken(req)
        if (!result.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') || ''
        const search = searchParams.get('search') || ''

        const posts = await prisma.post.findMany({
            where: {
                ...(status && { status: status as any }),
                ...(search && {
                    content: { contains: search, mode: 'insensitive' }
                }),
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true, avatar: true }
                },
                _count: {
                    select: { likes: true, comments: true }
                },
                moderation: {
                    select: { result: true, reason: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return NextResponse.json({ data: posts })

    } catch (error) {
        console.error('GET posts error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}