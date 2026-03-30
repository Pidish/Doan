import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params

    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = result.payload.id

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } }
    })

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } })
      return NextResponse.json({ message: "Unliked", liked: false })
    }

    // Tạo like
    await prisma.like.create({ data: { userId, postId } })

    // ✅ Tạo notification cho author của post (trừ khi tự like bài của mình)
    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: "LIKE",
          message: "đã thích bài viết của bạn",
          userId: post.authorId,  // người nhận
          senderId: userId,        // người gửi
          postId,
        }
      })
    }

    return NextResponse.json({ message: "Liked", liked: true }, { status: 201 })

  } catch (error) {
    console.error("POST /api/posts/[id]/like error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}