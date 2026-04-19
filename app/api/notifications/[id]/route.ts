import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

// PATCH /api/notifications/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } } // ✅ FIX
) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params // ✅ KHÔNG await
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
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } } // ✅ FIX
) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params // ✅ KHÔNG await
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