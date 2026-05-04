import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CAT_META: Record<string, { label: string; sublabel: string; color: string; tab: string }> = {
  SONG_XANH:    { label: '#SongXanhMoiNgay',   sublabel: 'Thiên nhiên · Đang nổi',     color: 'text-emerald-600', tab: 'SONG_XANH' },
  TAM_LY_HOC:   { label: 'Tâm hồn & Cảm xúc', sublabel: 'Tâm hồn · Phổ biến',        color: 'text-violet-500',  tab: 'TAM_LY_HOC' },
  TINH_LANG:    { label: '#TinhLangNgayMoi',    sublabel: 'Tĩnh lặng · Đang được yêu', color: 'text-indigo-500',  tab: 'TINH_LANG' },
  SANG_TAO:     { label: '#SangTaoMoiNgay',     sublabel: 'Sáng tạo · Xu hướng',       color: 'text-amber-500',   tab: 'SANG_TAO' },
  DANH_CHO_BAN: { label: '#NexoraUpdate',       sublabel: 'Cộng đồng · Mới nhất',      color: 'text-sky-500',     tab: 'FOR_YOU' },
}

const FALLBACK = Object.entries(CAT_META).slice(0, 3).map(([cat, meta]) => ({
  category: cat,
  tab: meta.tab,
  label: meta.label,
  sublabel: meta.sublabel,
  color: meta.color,
  countText: 'Khám phá ngay',
}))

export async function GET() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Fetch only category — avoid _count in select (Prisma limitation)
    const posts = await prisma.post.findMany({
      where: { status: 'ACTIVE', createdAt: { gte: sevenDaysAgo } },
      select: { category: true },
    })

    if (posts.length === 0) {
      return NextResponse.json({ trends: FALLBACK })
    }

    // Count posts per category
    const stats: Record<string, number> = {}
    for (const p of posts) {
      stats[p.category] = (stats[p.category] || 0) + 1
    }

    const trends = Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => {
        const meta = CAT_META[cat] ?? { label: cat, sublabel: 'Đang nổi', color: 'text-gray-500', tab: 'FOR_YOU' }
        return {
          category: cat,
          tab: meta.tab,
          label: meta.label,
          sublabel: meta.sublabel,
          color: meta.color,
          countText: `${count} bài viết tuần này`,
        }
      })

    return NextResponse.json({ trends })
  } catch (error) {
    console.error('Trending error:', error)
    return NextResponse.json({ trends: FALLBACK })
  }
}
