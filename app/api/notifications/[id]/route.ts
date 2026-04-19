import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

// PATCH /api/notifications/[id]
// Đánh dấu 1 thông báo là đã đọc
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = result.payload.id

    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Chỉ owner mới được đánh dấu đã đọc
    if (notification.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    })

    return NextResponse.json({ data: updated })

  } catch (error) {
    console.error("PATCH /api/notifications/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE /api/notifications/[id]
// Xóa 1 thông báo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = result.payload.id

    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    if (notification.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.notification.delete({ where: { id } })

    return NextResponse.json({ message: "Notification deleted" })

  } catch (error) {
    console.error("DELETE /api/notifications/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}