import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { comparePassword, generateTokenPair } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: "Wrong password" },
        { status: 401 }
      )
    }

    // ✅ Trả về accessToken + refreshToken đúng format
    const { accessToken, refreshToken } = generateTokenPair({
      id: user.id,
      email: user.email,
      username: user.name,
    })

    return NextResponse.json({
      message: "Login successful",
      accessToken,   // ✅ đúng field name
      refreshToken,  // ✅ đúng field name
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      }
    })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}