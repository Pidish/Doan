'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Loader2, Check, User, FileText, AtSign } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
}

// Resize + compress image to base64, max 300px, quality 0.8
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const MAX = 300
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { router.push('/login'); return }

    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const u = d.data
        setUser(u)
        setName(u.name || '')
        setBio(u.bio || '')
        setAvatarPreview(u.avatar || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Instant preview
    setAvatarPreview(URL.createObjectURL(file))
    setCompressing(true)
    try {
      const base64 = await compressImage(file)
      setAvatarBase64(base64)
    } catch {
      setError('Không thể đọc ảnh, thử lại với ảnh khác')
    } finally {
      setCompressing(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !user) return
    setSaving(true)
    setError('')
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          avatar: avatarBase64 ?? user.avatar,
        })
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => router.push('/profile'), 800)
      } else {
        setError('Lưu thất bại, thử lại')
      }
    } catch {
      setError('Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
    </div>
  )

  if (!user) return null

  const hasChanged = name !== (user.name || '') || bio !== (user.bio || '') || avatarBase64 !== null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 h-16 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 flex-1">Chỉnh sửa hồ sơ</h1>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanged || !name.trim() || compressing}
          className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all ${
            saved
              ? 'bg-emerald-100 text-emerald-700'
              : hasChanged && name.trim()
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved ? <><Check className="w-4 h-4" /> Đã lưu</>
            : 'Lưu'}
        </button>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
              {compressing ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : (
                <img
                  src={avatarPreview || `https://i.pravatar.cc/160?u=${user.id}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-9 h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-400">Bấm vào biểu tượng máy ảnh để thay ảnh</p>
          {avatarBase64 && !compressing && (
            <span className="text-xs text-emerald-600 font-medium">✓ Ảnh mới đã sẵn sàng</span>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Name */}
          <div className="px-5 py-4 border-b border-gray-100">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <User className="w-3.5 h-3.5" /> Tên hiển thị
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={50}
              placeholder="Tên của bạn"
              className="w-full text-gray-900 text-sm outline-none placeholder:text-gray-300 bg-transparent"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${name.length > 45 ? 'text-amber-500' : 'text-gray-300'}`}>{name.length}/50</span>
            </div>
          </div>

          {/* Username read-only */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <AtSign className="w-3.5 h-3.5" /> Tên người dùng
            </label>
            <p className="text-sm text-gray-400">@{user.email.split('@')[0]}</p>
            <p className="text-xs text-gray-300 mt-1">Tên người dùng không thể thay đổi</p>
          </div>

          {/* Bio */}
          <div className="px-5 py-4">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <FileText className="w-3.5 h-3.5" /> Giới thiệu bản thân
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={160}
              rows={4}
              placeholder="Viết vài dòng giới thiệu về bản thân..."
              className="w-full text-gray-900 text-sm outline-none placeholder:text-gray-300 bg-transparent resize-none leading-relaxed"
            />
            <div className="flex justify-end">
              <span className={`text-xs ${bio.length > 140 ? 'text-amber-500' : 'text-gray-300'}`}>{bio.length}/160</span>
            </div>
          </div>
        </div>

        {/* Email read-only */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Email</label>
          <p className="text-sm text-gray-400">{user.email}</p>
          <p className="text-xs text-gray-300 mt-1">Email không thể thay đổi</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Save bottom */}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanged || !name.trim() || compressing}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            saved
              ? 'bg-emerald-100 text-emerald-700'
              : hasChanged && name.trim()
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
           : saved ? <><Check className="w-4 h-4" /> Đã lưu thành công!</>
           : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  )
}
