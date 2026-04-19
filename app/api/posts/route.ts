import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

// ─── Phân loại bài viết ───────────────────────────────────────
function classifyPost(content: string): string {
  const text = content.toLowerCase()

  const keywords: Record<string, string[]> = {
    TINH_LANG: [
      'thiền', 'bình yên', 'tĩnh lặng', 'hít thở', 'tâm trí', 'yên tĩnh',
      'nghỉ ngơi', 'thư giãn', 'buông bỏ', 'hiện tại', 'chánh niệm',
      'nội tâm', 'tâm hồn', 'mindful', 'peaceful', 'calm'
    ],
    SONG_XANH: [
      'cây', 'rau', 'trồng', 'xanh', 'môi trường', 'thiên nhiên',
      'ban công', 'vườn', 'tái chế', 'bền vững', 'hoa', 'rừng',
      'biển', 'sạch', 'tiết kiệm', 'organic', 'plant', 'eco'
    ],
    SANG_TAO: [
      'thiết kế', 'design', 'sáng tạo', 'nghệ thuật', 'vẽ', 'ui', 'ux',
      'code', 'lập trình', 'project', 'ý tưởng', 'creative', 'màu sắc',
      'typography', 'app', 'website', 'figma', 'portfolio'
    ],
    TAM_LY_HOC: [
      'tâm lý', 'cảm xúc', 'lo lắng', 'stress', 'sợ hãi', 'tự tin',
      'động lực', 'thói quen', 'phát triển bản thân', 'mindset',
      'tư duy', 'hành vi', 'therapy', 'trị liệu', 'anxiety', 'growth'
    ],
  }

  const scores: Record<string, number> = {}
  for (const [cat, words] of Object.entries(keywords)) {
    scores[cat] = words.filter(word => text.includes(word)).length
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return best[1] > 0 ? best[0] : 'DANH_CHO_BAN'
}

// POST /api/posts
export async function POST(req: NextRequest) {
  try {
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

    // ✅ Gọi trong function
    const category = classifyPost(content)
    console.log('Category:', category)

    const post = await prisma.post.create({
      data: {
        content,
        status: "ACTIVE",
        authorId: userId,
        category: category as any,
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

// GET /api/posts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get("cursor")
    const category = searchParams.get("category")

    let take = Number(searchParams.get("take"))
    if (isNaN(take) || take <= 0 || take > 50) take = 10

    const posts = await prisma.post.findMany({
      where: {
        status: "ACTIVE",
        // ✅ Filter theo category
        ...(category && category !== 'DANH_CHO_BAN' && { category: category as any })
      },
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