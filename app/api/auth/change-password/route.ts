import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken, comparePassword, hashPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 })

    if (newPassword.length < 6)
      return NextResponse.json({ error: "Mật khẩu mới phải từ 6 ký tự" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: result.payload.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const isMatch = await comparePassword(currentPassword, user.password)
    if (!isMatch) return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 })

    const hashed = await hashPassword(newPassword)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    return NextResponse.json({ message: "Đổi mật khẩu thành công" })
  } catch (error) {
    console.error("change-password error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
