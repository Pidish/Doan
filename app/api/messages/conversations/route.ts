import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

// GET /api/messages/conversations
// Trả về danh sách cuộc trò chuyện, sắp xếp theo tin nhắn mới nhất
export async function GET(req: NextRequest) {
  const result = verifyAccessToken(req)
  if (!result.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = result.payload.id

  // Lấy tất cả tin nhắn liên quan, sắp xếp mới nhất trước
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      deletedAt: null,
    },
    select: {
      senderId: true,
      receiverId: true,
      content: true,
      createdAt: true,
      sender: { select: { id: true, name: true, email: true, avatar: true } },
      receiver: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  // Nhóm theo người dùng kia, chỉ giữ tin nhắn mới nhất mỗi cuộc trò chuyện
  const seen = new Set<string>()
  const conversations: Array<{
    userId: string
    name: string
    email: string
    avatar: string | null
    lastMessage: string
    lastMessageAt: string
    lastMessageSenderId: string
  }> = []

  for (const msg of messages) {
    const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId
    if (seen.has(otherId)) continue
    seen.add(otherId)
    const other = msg.senderId === userId ? msg.receiver : msg.sender
    conversations.push({
      userId: otherId,
      name: other.name,
      email: other.email,
      avatar: other.avatar,
      lastMessage: msg.content,
      lastMessageAt: msg.createdAt.toISOString(),
      lastMessageSenderId: msg.senderId,
    })
  }

  return NextResponse.json({ data: conversations })
}
