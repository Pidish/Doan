import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

// GET /api/notifications
// Lấy danh sách thông báo của user đang đăng nhập
export async function GET(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = result.payload.id

    const { searchParams } = new URL(req.url)
    const onlyUnread = searchParams.get("unread") === "true"

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(onlyUnread && { isRead: false })
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    })

    return NextResponse.json({ data: notifications, unreadCount })

  } catch (error) {
    console.error("GET /api/notifications error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}