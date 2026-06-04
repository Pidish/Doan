import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

// GET /api/block — list of user IDs I have blocked
export async function GET(req: NextRequest) {
  const result = verifyAccessToken(req)
  if (!result.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const blocks = await prisma.block.findMany({
    where: { blockerId: result.payload.id },
    select: { blockedId: true },
  })

  return NextResponse.json({ data: blocks.map(b => b.blockedId) })
}

// POST /api/block — toggle block/unblock
// Body: { blockedId }
export async function POST(req: NextRequest) {
  const result = verifyAccessToken(req)
  if (!result.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const blockerId = result.payload.id
  const { blockedId } = await req.json()

  if (!blockedId) return NextResponse.json({ error: 'Missing blockedId' }, { status: 400 })
  if (blockerId === blockedId) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  })

  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } })
    return NextResponse.json({ blocked: false })
  }

  // Block: also remove any existing follows between the two users
  await prisma.$transaction([
    prisma.block.create({ data: { blockerId, blockedId } }),
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    }),
  ])

  return NextResponse.json({ blocked: true })
}
