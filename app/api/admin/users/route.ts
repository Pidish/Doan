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
        const search = searchParams.get('search') || ''
        const role = searchParams.get('role') || ''

        const users = await prisma.user.findMany({
            where: {
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ]
                }),
                ...(role && { role: role as any }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: { posts: true, followers: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ data: users })

    } catch (error) {
        console.error('GET users error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}