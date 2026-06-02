import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `Bạn là Nexora AI — trợ lý thông minh của mạng xã hội Nexora.
Bạn thân thiện, hiểu biết rộng và luôn trả lời bằng tiếng Việt trừ khi người dùng hỏi bằng ngôn ngữ khác.
Bạn có thể giúp người dùng với mọi chủ đề: cuộc sống, công nghệ, sáng tạo nội dung, học tập, lập trình, v.v.
Trả lời ngắn gọn, rõ ràng và có cấu trúc. Dùng markdown khi cần thiết (danh sách, code block, in đậm).`

// POST — gửi prompt, nhận response, lưu DB
export async function POST(req: NextRequest) {
  const result = verifyAccessToken(req)
  if (!result.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt } = await req.json()
  if (!prompt?.trim()) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })

  const userId = result.payload.id

  // Lấy 8 exchange gần nhất làm context
  const history = await prisma.aIHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  const contextMessages = history.reverse().flatMap(h => [
    { role: 'user' as const, content: h.prompt },
    { role: 'assistant' as const, content: h.response },
  ])

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...contextMessages,
      { role: 'user', content: prompt },
    ],
    max_tokens: 2048,
    temperature: 0.7,
  })

  const response = completion.choices[0].message.content ?? ''

  const saved = await prisma.aIHistory.create({
    data: { userId, prompt, response },
  })

  return NextResponse.json({
    success: true,
    data: { id: saved.id, prompt, response, createdAt: saved.createdAt.toISOString() },
  })
}

// GET — lấy lịch sử chat
export async function GET(req: NextRequest) {
  const result = verifyAccessToken(req)
  if (!result.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = result.payload.id

  const history = await prisma.aIHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })

  return NextResponse.json({ data: history.map(h => ({ ...h, createdAt: h.createdAt.toISOString() })) })
}

// DELETE — xóa toàn bộ lịch sử
export async function DELETE(req: NextRequest) {
  const result = verifyAccessToken(req)
  if (!result.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.aIHistory.deleteMany({ where: { userId: result.payload.id } })

  return NextResponse.json({ success: true })
}
