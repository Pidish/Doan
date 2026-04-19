import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const result = verifyAccessToken(req)
        if (!result.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [
            totalUsers,
            totalPosts,
            totalComments,
            totalLikes,
            blockedPosts,
            adminUsers,
            newUsersToday,
            newPostsToday,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.post.count(),
            prisma.comment.count(),
            prisma.like.count(),
            prisma.post.count({ where: { status: 'BLOCKED' } }),
            prisma.user.count({ where: { role: 'ADMIN' } }),
            prisma.user.count({
                where: {
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                }
            }),
            prisma.post.count({
                where: {
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                }
            }),
        ])

        // User tăng trưởng 7 ngày
        const last7Days = await Promise.all(
            Array.from({ length: 7 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const start = new Date(date)
                start.setHours(0, 0, 0, 0)
                const end = new Date(date)
                end.setHours(23, 59, 59, 999)

                return Promise.all([
                    prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
                    prisma.post.count({ where: { createdAt: { gte: start, lte: end } } }),
                ]).then(([users, posts]) => ({
                    date: start.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
                    users,
                    posts
                }))
            })
        )

        return NextResponse.json({
            totalUsers,
            totalPosts,
            totalComments,
            totalLikes,
            blockedPosts,
            adminUsers,
            newUsersToday,
            newPostsToday,
            last7Days: last7Days.reverse(),
        })

    } catch (error) {
        console.error('Stats error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}