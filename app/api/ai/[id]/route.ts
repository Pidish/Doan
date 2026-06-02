import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = verifyAccessToken(req)
  if (!result.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = result.payload.id

  await prisma.aIHistory.deleteMany({ where: { id, userId } })

  return NextResponse.json({ success: true })
}
