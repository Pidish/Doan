import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import type { CustomJwtPayload } from '@/lib/auth'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return new Response('Unauthorized', { status: 401 })

  let userId: string
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload
    userId = payload.id
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let lastCheck = new Date()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false

      const enqueue = (data: string) => {
        if (closed) return
        try { controller.enqueue(encoder.encode(data)) } catch { }
      }

      // Heartbeat để xác nhận kết nối
      enqueue(': connected\n\n')

      const poll = async () => {
        if (closed) return
        try {
          const checkTime = new Date()
          const newNotifs = await prisma.notification.findMany({
            where: { userId, createdAt: { gt: lastCheck }, isRead: false },
            include: { sender: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
          })
          lastCheck = checkTime

          if (newNotifs.length > 0) {
            const unreadCount = await prisma.notification.count({
              where: { userId, isRead: false }
            })
            enqueue(`data: ${JSON.stringify({ notifications: newNotifs, unreadCount })}\n\n`)
          }
        } catch { /* bỏ qua lỗi DB */ }
      }

      const interval = setInterval(poll, 5000)

      // Đóng sau 55s → EventSource client tự reconnect
      const timeout = setTimeout(() => {
        closed = true
        clearInterval(interval)
        try { controller.close() } catch { }
      }, 55000)

      req.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(interval)
        clearTimeout(timeout)
        try { controller.close() } catch { }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}
