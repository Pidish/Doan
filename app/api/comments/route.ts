import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("postId")

    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 })
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, email: true, avatar: true } }
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    })

    return NextResponse.json({ data: comments })

  } catch (error) {
    console.error("GET /api/comments error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = result.payload.id
    const { content, postId } = await req.json()

    if (!content || !postId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: { content, postId, authorId: userId },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    // ✅ Tạo notification cho author của post (trừ khi tự comment bài của mình)
    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          message: "đã bình luận về bài viết của bạn",
          userId: post.authorId,  // người nhận
          senderId: userId,        // người gửi
          postId,
        }
      })
    }

    return NextResponse.json({ data: comment }, { status: 201 })

  } catch (error) {
    console.error("POST /api/comments error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}