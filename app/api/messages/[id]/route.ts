import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

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

    const message = await prisma.message.findUnique({ where: { id } })
    if (!message) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (message.senderId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deletedAt = new Date()

    await prisma.message.update({
      where: { id },
      data: { deletedAt },
    })

    // Broadcast để cả 2 phía cập nhật real-time
    const channelName = `chat-${[message.senderId, message.receiverId].sort().join('-')}`
    await pusher.trigger(channelName, 'message-deleted', {
      id,
      deletedAt: deletedAt.toISOString(),
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE message error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
