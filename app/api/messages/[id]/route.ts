import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

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
        const userId = result.payload.id

        // Chỉ người gửi mới được xóa
        const message = await prisma.message.findUnique({ where: { id } })
        if (!message) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        if (message.senderId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.message.delete({ where: { id } })
        return NextResponse.json({ message: 'Deleted' })

    } catch (error) {
        console.error('DELETE message error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}