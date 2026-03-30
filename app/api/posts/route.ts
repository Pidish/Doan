import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

// POST /api/posts - Tạo post
export async function POST(req: NextRequest) {
  try {
    // ✅ SỬA: truyền req thay vì token string
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = result.payload.id

    const body = await req.json()
    const content = body?.content?.trim()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({ error: "Content must be under 500 characters" }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        content,
        status: "ACTIVE",
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    })

    return NextResponse.json({ data: post }, { status: 201 })

  } catch (error) {
    console.error("POST /api/posts error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// GET /api/posts - Feed với cursor pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get("cursor")

    let take = Number(searchParams.get("take"))
    if (isNaN(take) || take <= 0 || take > 50) take = 10

    const posts = await prisma.post.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    })

    let nextCursor: string | null = null
    if (posts.length > take) {
      const nextItem = posts.pop()
      nextCursor = nextItem?.id ?? null
    }

    return NextResponse.json({ data: posts, nextCursor })

  } catch (error) {
    console.error("GET /api/posts error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
