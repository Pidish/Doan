import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(req: NextRequest) {
  const authResult = verifyAccessToken(req)
  if (!authResult.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Chỉ chấp nhận ảnh JPG, PNG, GIF, WebP' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Ảnh không được vượt quá 5MB' }, { status: 400 })

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const filename = `${randomUUID()}.${ext}`
    const bytes = await file.arrayBuffer()
    await writeFile(join(process.cwd(), 'public', 'uploads', filename), Buffer.from(bytes))

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload thất bại' }, { status: 500 })
  }
}
