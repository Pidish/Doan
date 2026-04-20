import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

/* =========================
   GET - Chi tiết post
========================= */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = result.payload.id

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        comments: {
          include: { author: { select: { id: true, name: true, email: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        likes: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { likes: true, comments: true } },
      },
    })

    const isLiked = post?.likes.some(l => l.userId === userId) ?? false

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ data: { ...post, isLiked } })
  } catch (error) {
    console.error("GET /api/posts/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/* =========================
   PUT - Update post
========================= */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params  // ✅ await params

    // ✅ dùng đúng cách — truyền req chứ không phải token string
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = result.payload.id

    const existingPost = await prisma.post.findUnique({ where: { id } })
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (existingPost.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden - Not your post" }, { status: 403 })
    }

    const body = await req.json()
    const content = body?.content?.trim()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { content }
    })

    return NextResponse.json({ data: updatedPost })

  } catch (error) {
    console.error("PUT /api/posts/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/* =========================
   DELETE - Xóa post
========================= */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ await params
) {
  try {
    const { id } = await params  // ✅ await params

    const result = verifyAccessToken(req)  // ✅ truyền req
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = result.payload.id

    const existingPost = await prisma.post.findUnique({ where: { id } })
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (existingPost.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden - Not your post" }, { status: 403 })
    }

    await prisma.post.delete({ where: { id } })

    return NextResponse.json({ message: "Post deleted successfully" })

  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}