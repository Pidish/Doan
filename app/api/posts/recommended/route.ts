import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'
import Groq from 'groq-sdk'

const CAT_LABELS: Record<string, string> = {
  TINH_LANG: 'Tĩnh lặng & Thiền định',
  SONG_XANH: 'Sống xanh & Thiên nhiên',
  SANG_TAO: 'Sáng tạo & Nghệ thuật',
  TAM_LY_HOC: 'Tâm lý học',
  DANH_CHO_BAN: 'Tổng hợp',
}

let _groq: Groq | null = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

async function buildTasteProfile(
  topCats: string[],
  totalLikes: number,
  totalComments: number
): Promise<string> {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return `Bạn có xu hướng thích nội dung về ${topCats.map(c => CAT_LABELS[c]).join(', ')}.`
  }
  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'Bạn là AI phân tích sở thích người dùng mạng xã hội Nexora. Viết 1 câu ngắn gọn, thân thiện, bằng tiếng Việt mô tả sở thích của người dùng dựa trên dữ liệu. Không quá 100 ký tự.',
        },
        {
          role: 'user',
          content: `Người dùng đã thích ${totalLikes} bài, bình luận ${totalComments} lần. Chủ đề yêu thích: ${topCats.map(c => CAT_LABELS[c]).join(', ')}.`,
        },
      ],
      max_tokens: 80,
    })
    return completion.choices[0]?.message?.content?.trim() || `Bạn thích nội dung về ${topCats.map(c => CAT_LABELS[c]).join(', ')}.`
  } catch {
    return `Bạn có xu hướng thích nội dung về ${topCats.map(c => CAT_LABELS[c]).join(', ')}.`
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = verifyAccessToken(req)
    if (!authResult.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = authResult.payload.id

    // Get user's liked posts (category + sentiment data)
    const [likedPosts, commentedPosts] = await Promise.all([
      prisma.like.findMany({
        where: { userId },
        include: { post: { select: { category: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.comment.findMany({
        where: { authorId: userId },
        include: { post: { select: { category: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])

    // Build category affinity (likes count 1x, comments count 2x = more intent)
    const catScore: Record<string, number> = {}
    likedPosts.forEach(l => {
      const c = l.post.category
      catScore[c] = (catScore[c] || 0) + 1
    })
    commentedPosts.forEach(c => {
      const cat = c.post.category
      catScore[cat] = (catScore[cat] || 0) + 2
    })

    const totalWeight = Object.values(catScore).reduce((s, v) => s + v, 0)
    const catAffinity: Record<string, number> = {}
    if (totalWeight > 0) {
      Object.entries(catScore).forEach(([c, w]) => {
        catAffinity[c] = w / totalWeight
      })
    }

    const topCats = Object.entries(catAffinity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c)

    // Get already-seen post IDs (liked)
    const seenIds = likedPosts.map(l => l.postId)

    // Fetch candidate posts
    const candidates = await prisma.post.findMany({
      where: {
        status: 'ACTIVE',
        authorId: { not: userId },
        id: { notIn: seenIds.slice(0, 100) },
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        repost: { include: { author: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count: { select: { likes: true, comments: true, reposts: true } },
        likes: { where: { userId }, select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const now = Date.now()

    // Score each post
    const scored = candidates.map(post => {
      const affinity = catAffinity[post.category] ?? 0.05
      const engagement = post._count.likes + post._count.comments * 2
      const engScore = Math.min(engagement / 30, 1)
      const ageDays = (now - new Date(post.createdAt).getTime()) / 86400000
      const recency = Math.max(0, 1 - ageDays / 10)

      // Bonus for top preferred categories
      const catBonus = topCats.includes(post.category) ? 0.15 : 0

      const score = affinity * 0.45 + engScore * 0.30 + recency * 0.15 + catBonus

      const { likes, ...rest } = post as typeof post & { likes?: { userId: string }[] }
      return {
        ...rest,
        isLiked: (likes?.length ?? 0) > 0,
        _score: score,
      }
    })

    // Sort and take top 20, then shuffle slightly for variety
    scored.sort((a, b) => b._score - a._score)
    const top30 = scored.slice(0, 30)
    // Slight shuffle: mix top 10 with random from 11-30 for discovery
    const definite = top30.slice(0, 10)
    const discovery = top30.slice(10).sort(() => Math.random() - 0.5).slice(0, 10)
    const feed = [...definite, ...discovery].map(({ _score, ...rest }) => rest)

    // Build taste profile
    const tasteDescription = topCats.length > 0
      ? await buildTasteProfile(topCats, likedPosts.length, commentedPosts.length)
      : 'Hãy tương tác với các bài viết để AI hiểu sở thích của bạn hơn!'

    return NextResponse.json({
      data: feed,
      profile: {
        topCategories: topCats.map(c => ({ key: c, label: CAT_LABELS[c], score: Math.round((catAffinity[c] || 0) * 100) })),
        totalLikes: likedPosts.length,
        description: tasteDescription,
      },
    })
  } catch (error) {
    console.error('Recommended error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
