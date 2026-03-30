import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signToken } from "@/lib/jwt"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return NextResponse.json(
        { error: "Wrong password" },
        { status: 401 }
      )
    }

    const token = signToken({
      id: user.id,
      email: user.email,
    })

    return NextResponse.json({
      message: "Login successful",
      token,
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}