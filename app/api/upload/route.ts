import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB

export async function POST(req: NextRequest) {
  const authResult = verifyAccessToken(req)
  if (!authResult.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const isImage = IMAGE_TYPES.includes(file.type)
    const isVideo = VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Chỉ chấp nhận ảnh (JPG, PNG, GIF, WebP) hoặc video (MP4, WebM, MOV)' }, { status: 400 })
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      return NextResponse.json({
        error: isVideo ? 'Video không được vượt quá 100MB' : 'Ảnh không được vượt quá 10MB'
      }, { status: 400 })
    }

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
      'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/x-msvideo': 'avi',
    }
    const ext = extMap[file.type] ?? 'bin'
    const filename = `${randomUUID()}.${ext}`
    const uploadsDir = join(process.cwd(), 'public', 'uploads')

    await mkdir(uploadsDir, { recursive: true })
    const bytes = await file.arrayBuffer()
    await writeFile(join(uploadsDir, filename), Buffer.from(bytes))

    return NextResponse.json({ url: `/uploads/${filename}`, type: isVideo ? 'video' : 'image' })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload thất bại' }, { status: 500 })
  }
}
