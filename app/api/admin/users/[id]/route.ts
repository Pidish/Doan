import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

// PATCH — đổi role hoặc ban/unban
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const result = verifyAccessToken(req)
        if (!result.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { role, isActive } = await req.json()

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(role !== undefined && { role }),
                ...(isActive !== undefined && { isActive }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
            }
        })

        return NextResponse.json({ data: user })

    } catch (error) {
        console.error('PATCH user error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE — xóa user
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const result = verifyAccessToken(req)
        if (!result.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        await prisma.user.delete({ where: { id } })

        return NextResponse.json({ message: 'User deleted' })

    } catch (error) {
        console.error('DELETE user error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}