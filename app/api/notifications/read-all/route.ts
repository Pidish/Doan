import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

// PATCH /api/notifications/read-all
// Đánh dấu tất cả thông báo là đã đọc
export async function PATCH(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = result.payload.id

    const { count } = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    })

    return NextResponse.json({ message: `Marked ${count} notifications as read` })

  } catch (error) {
    console.error("PATCH /api/notifications/read-all error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
