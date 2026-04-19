import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// POST — gửi tin nhắn
export async function POST(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiverId, message } = await req.json()
    if (!receiverId || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const senderId = result.payload.id

    // ✅ Lưu vào DB
    const saved = await prisma.message.create({
      data: {
        content: message,
        senderId,
        receiverId,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    })

    const channelName = `chat-${[senderId, receiverId].sort().join('-')}`

    const messageData = {
      id: saved.id,
      senderId,
      senderName: saved.sender.name,
      message: saved.content,
      timestamp: saved.createdAt.toISOString(),
    }

    await pusher.trigger(channelName, 'new-message', messageData)

    return NextResponse.json({ success: true, data: messageData })

  } catch (error) {
    console.error('Message error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET — lấy lịch sử chat
export async function GET(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const receiverId = searchParams.get('receiverId')
    if (!receiverId) {
      return NextResponse.json({ error: 'Missing receiverId' }, { status: 400 })
    }

    const senderId = result.payload.id

    // ✅ Lấy tin nhắn 2 chiều
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ]
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 50
    })

    const data = messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.name,
      message: m.content,
      timestamp: m.createdAt.toISOString(),
    }))

    return NextResponse.json({ data })

  } catch (error) {
    console.error('GET messages error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}