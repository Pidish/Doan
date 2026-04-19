import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

// PATCH — đổi status
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
        const { status } = await req.json()

        const post = await prisma.post.update({
            where: { id },
            data: { status },
        })

        return NextResponse.json({ data: post })

    } catch (error) {
        console.error('PATCH post error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE — xóa post
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
        await prisma.post.delete({ where: { id } })

        return NextResponse.json({ message: 'Post deleted' })

    } catch (error) {
        console.error('DELETE post error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}