'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { PostCard } from '@/src/components/PostCard'
import { RightSidebar } from '@/src/components/RightSidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, PenSquare, Sparkles, TrendingUp, ImagePlus, X, Users, Compass, ShieldAlert, Clock, Smile } from 'lucide-react'

const EMOJIS = [
  '😀','😊','😍','🥰','😎','🤩','😄','😁','🎉','❤️',
  '💕','💯','🌟','✨','🙌','👏','🔥','💪','🌈','🌸',
  '😂','🤣','😆','😜','🤔','🙏','💭','💡','📝','🎵',
  '🌿','🍃','🌻','🌺','🦋','🌙','⭐','🌊','🏔️','🌅',
]

interface Post {
  id: string
  content: string
  imageUrl?: string
  createdAt: string
  isLiked?: boolean
  author: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  _count: {
    likes: number
    comments: number
  }
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isVideoMedia, setIsVideoMedia] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar?: string; postBannedUntil?: string | null } | null>(null)
  const [banTimeLeft, setBanTimeLeft] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'FOR_YOU' | 'SONG_XANH' | 'TAM_LY_HOC' | 'TINH_LANG' | 'SANG_TAO' | 'AI_RECOMMENDED'>('FOR_YOU')
  const [aiProfile, setAiProfile] = useState<{
    topCategories: { key: string; label: string; score: number }[]
    totalLikes: number
    description: string
  } | null>(null)

  const fetchPosts = useCallback(async (
    cursor?: string,
    tkn?: string | null,
    tab?: typeof activeTab,
    userId?: string
  ) => {
    const t = tkn ?? token
    const currentTab = tab ?? activeTab
    setLoading(true)
    try {
      let url: string
      if (currentTab === 'AI_RECOMMENDED') {
        url = '/api/posts/recommended'
      } else {
        // Tất cả các tab đều dùng feed (chỉ bài của người follow + bản thân)
        const uid = userId ?? currentUser?.id ?? ''
        const categoryParam = ['SONG_XANH', 'TAM_LY_HOC', 'TINH_LANG', 'SANG_TAO'].includes(currentTab)
          ? `&category=${currentTab}`
          : ''
        url = cursor
          ? `/api/posts/feed?userId=${uid}${categoryParam}&cursor=${cursor}`
          : `/api/posts/feed?userId=${uid}${categoryParam}`
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } })
      const data = await res.json()
      if (currentTab === 'AI_RECOMMENDED' && data.profile) {
        setAiProfile(data.profile)
      }
      if (cursor) {
        setPosts(prev => [...prev, ...(data.data || [])])
      } else {
        setPosts(data.data || [])
      }
      setNextCursor(data.nextCursor ?? null)
    } catch {
      setError('Không thể tải bài viết')
    } finally {
      setLoading(false)
    }
  }, [token, activeTab, currentUser?.id])

  // Single mount effect — one token read, one /api/me call
  useEffect(() => {
    const t = localStorage.getItem('accessToken')
    if (!t) return
    setToken(t)

    const validTabs = ['FOR_YOU', 'SONG_XANH', 'TAM_LY_HOC', 'TINH_LANG', 'SANG_TAO', 'AI_RECOMMENDED']
    const urlTab = new URLSearchParams(window.location.search).get('tab')
    const initialTab = (urlTab && validTabs.includes(urlTab) ? urlTab : 'FOR_YOU') as typeof activeTab
    if (initialTab !== 'FOR_YOU') setActiveTab(initialTab)

    fetch('/api/me', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => {
        setCurrentUser(d.data)
        fetchPosts(undefined, t, initialTab, d.data?.id)
      })
      .catch(() => fetchPosts(undefined, t, initialTab))
  }, [])

  // Reload when tab changes
  useEffect(() => {
    if (token && currentUser) {
      setPosts([])
      fetchPosts(undefined, token, activeTab, currentUser.id)
    }
  }, [activeTab])

  // Countdown timer cho lệnh cấm đăng bài
  useEffect(() => {
    const calcLeft = () => {
      if (!currentUser?.postBannedUntil) { setBanTimeLeft(null); return }
      const ms = new Date(currentUser.postBannedUntil).getTime() - Date.now()
      if (ms <= 0) { setBanTimeLeft(null); return }
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      setBanTimeLeft(h > 0 ? `${h} giờ ${m} phút` : `${m} phút`)
    }
    calcLeft()
    const id = setInterval(calcLeft, 60000)
    return () => clearInterval(id)
  }, [currentUser?.postBannedUntil])

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmojiPicker])

  // Listen for tab-change events from RightSidebar trending clicks
  useEffect(() => {
    const handler = (e: Event) => {
      const newTab = (e as CustomEvent<string>).detail as typeof activeTab
      const t = localStorage.getItem('accessToken')
      setActiveTab(newTab)
      setPosts([])
      fetchPosts(undefined, t, newTab, currentUser?.id)
    }
    window.addEventListener('nexora:set-tab', handler)
    return () => window.removeEventListener('nexora:set-tab', handler)
  }, [currentUser?.id])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVid = file.type.startsWith('video/')
    const maxSize = isVid ? 100 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError(isVid ? 'Video không được vượt quá 100MB' : 'Ảnh không được vượt quá 10MB')
      return
    }
    setImageFile(file)
    setIsVideoMedia(isVid)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setIsVideoMedia(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current
    if (!ta) { setNewPost(prev => prev + emoji); return }
    const start = ta.selectionStart ?? newPost.length
    const end = ta.selectionEnd ?? newPost.length
    const updated = newPost.slice(0, start) + emoji + newPost.slice(end)
    setNewPost(updated)
    setTimeout(() => { ta.setSelectionRange(start + emoji.length, start + emoji.length); ta.focus() }, 0)
  }

  const handleCreatePost = async () => {
    if (!newPost.trim() && !imageFile) return
    setPosting(true)
    setError('')
    const t = localStorage.getItem('accessToken')

    try {
      let imageUrl: string | undefined
      if (imageFile) {
        setUploading(true)
        const fd = new FormData()
        fd.append('file', imageFile)
        const upRes = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: fd })
        const upData = await upRes.json()
        setUploading(false)
        if (!upRes.ok) { setError(upData.error || 'Upload ảnh thất bại'); setPosting(false); return }
        imageUrl = upData.url
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ content: newPost, imageUrl }),
      })
      const data = await res.json()

      if (res.ok) {
        setPosts(prev => [data.data, ...prev])
        setNewPost('')
        removeImage()
        if (data.warning) setError(`⚠️ Bài đã đăng nhưng cần xem xét: ${data.warning}`)
      } else if (res.status === 403 && data.banned) {
        // Cập nhật trạng thái ban trong currentUser để hiển thị banner
        setCurrentUser(prev => prev ? { ...prev, postBannedUntil: data.bannedUntil } : prev)
      } else if (res.status === 422 && data.blocked) {
        // Bài bị chặn → cập nhật ban
        setCurrentUser(prev => prev ? { ...prev, postBannedUntil: data.bannedUntil } : prev)
      } else {
        setError(data.error || 'Không thể đăng bài')
      }
    } catch {
      setError('Không thể kết nối server')
    } finally {
      setPosting(false)
      setUploading(false)
    }
  }

  return (
    <div className="flex">
      <main className="flex-1 mr-0 lg:mr-[350px] p-6 md:p-10">

        {/* Banner */}
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700 p-8 md:p-10 flex items-center min-h-[200px] md:min-h-[240px] shadow-lg"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 0% 100%, white 0%, transparent 60%), radial-gradient(circle at 100% 0%, white 0%, transparent 50%)' }} />
          <div className="relative z-10 max-w-md">
            <p className="text-emerald-200/80 text-xs font-semibold uppercase tracking-widest mb-2">Nexora · Digital Sanctuary</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
              Chào buổi sáng, <br />
              <span className="text-emerald-200">{currentUser?.name?.split(' ').pop() ?? 'bạn'}</span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Hãy dành một chút thời gian hít thở và kết nối với cộng đồng yên bình của chúng ta.
            </p>
          </div>
          <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-10 top-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none hidden md:block" />
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO5bVeWn0qQLFQRgnV8vWrjaHqPpFJcVxYNyTCwJQwXpvJMJ4558NhbZr2V0vWDc3IKvw6gTTi_KmWCiMJoL7SQqoGTI5tn5wizM2Y8DyrykGM2ZszM24jmu5tCeK9r9JSvgvIYS808fminLcqhX89PFjkR0AAxNnZrUD7fEE7RVdxg57_L5HFPbA_dfWnCJ_GItZTe68olXPpTnMCsoyl9XnwcYOQunqfNN_oxjS4WXG-Kr0i8eq8OLUjWqDte_TjC3AmDECEPsGN"
            alt="Nature"
            className="absolute right-0 top-0 h-full w-2/5 object-cover opacity-20 mix-blend-luminosity hidden md:block"
          />
        </motion.section>

        {/* Tạo post mới */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          {/* Ban banner */}
          {banTimeLeft && (
            <div className="flex items-center gap-3 px-5 py-3 bg-red-50 border-b border-red-100">
              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 flex-1">
                <span className="font-semibold">Tài khoản bị hạn chế đăng bài</span> do vi phạm nội dung.
              </p>
              <span className="flex items-center gap-1 text-xs font-medium text-red-500 flex-shrink-0">
                <Clock className="w-3.5 h-3.5" />
                Còn {banTimeLeft}
              </span>
            </div>
          )}
          <div className="p-5 flex gap-3">
            <Link href="/profile" className="flex-shrink-0 mt-0.5">
              <img
                src={currentUser?.avatar || `https://i.pravatar.cc/40?u=${currentUser?.id ?? 'me'}`}
                alt={currentUser?.name || 'avatar'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white hover:ring-emerald-300 transition-all cursor-pointer shadow-sm"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder={banTimeLeft ? `Bạn không thể đăng bài trong ${banTimeLeft} nữa...` : 'Bạn đang nghĩ gì vậy?'}
                disabled={!!banTimeLeft}
                className="w-full bg-gray-50 rounded-xl p-3.5 text-sm text-gray-900 placeholder:text-gray-400 resize-none outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200 border border-transparent focus:border-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                rows={3}
              />

              {/* Media preview */}
              {imagePreview && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-100 bg-black/5">
                  {isVideoMedia ? (
                    <video src={imagePreview} controls className="w-full max-h-64 object-contain" />
                  ) : (
                    <img src={imagePreview} alt="preview" className="w-full max-h-64 object-cover" />
                  )}
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo"
            className="hidden"
            onChange={handleImageChange}
          />

          <div className="px-5 pb-4 flex items-center justify-between border-t border-gray-50 pt-3">
            <div className="flex items-center gap-3">
              {/* Emoji picker */}
              <div ref={emojiPickerRef} className="relative">
                <button
                  onClick={() => setShowEmojiPicker(v => !v)}
                  disabled={!!banTimeLeft}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-emerald-600 transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Smile className="w-4 h-4" />
                  <span>Biểu cảm</span>
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-30">
                    <div className="grid grid-cols-10 gap-0.5">
                      {EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => { insertEmoji(emoji); setShowEmojiPicker(false) }}
                          className="text-lg hover:bg-gray-100 rounded-lg p-1 transition-colors leading-none"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Media upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!!banTimeLeft}
                className="flex items-center gap-1.5 text-gray-400 hover:text-emerald-600 transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ImagePlus className="w-4 h-4" />
                <span>Ảnh / Video</span>
              </button>

              <p className="text-xs text-gray-300">{newPost.length > 0 ? `${newPost.length}/500` : ''}</p>
            </div>
            <button
              onClick={handleCreatePost}
              disabled={posting || uploading || (!newPost.trim() && !imageFile) || !!banTimeLeft}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-700 text-white rounded-full font-semibold text-sm hover:bg-emerald-800 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {uploading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {isVideoMedia ? 'Đang tải video...' : 'Đang tải ảnh...'}</>
              ) : posting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đăng...</>
              ) : (
                <><PenSquare className="w-3.5 h-3.5" /> Đăng bài</>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        {(() => {
          const tabs = [
            { key: 'FOR_YOU', label: '🏠 Đang theo dõi' },
            { key: 'AI_RECOMMENDED', label: '✨ AI Gợi ý' },
            { key: 'TINH_LANG', label: 'Tĩnh lặng' },
            { key: 'SONG_XANH', label: 'Thiên nhiên' },
            { key: 'SANG_TAO', label: 'Sáng tạo' },
            { key: 'TAM_LY_HOC', label: 'Tâm hồn' },
          ] as const
          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 px-2">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3.5 text-sm font-medium transition-all whitespace-nowrap relative flex-shrink-0 ${
                      activeTab === tab.key
                        ? 'text-emerald-700 font-semibold after:content-[\'\'] after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-emerald-600 after:rounded-full'
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {/* AI Profile Banner */}
        <AnimatePresence>
          {activeTab === 'AI_RECOMMENDED' && aiProfile && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-violet-900 text-sm mb-1">Hồ sơ sở thích của bạn</p>
                  <p className="text-violet-700 text-sm leading-relaxed mb-3">{aiProfile.description}</p>
                  {aiProfile.topCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {aiProfile.topCategories.map(cat => (
                        <span key={cat.key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-violet-200 rounded-full text-xs font-semibold text-violet-700">
                          <TrendingUp className="w-3 h-3" />
                          {cat.label}
                          <span className="text-violet-400 font-normal">{cat.score}%</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts */}
        {loading ? (
          <div suppressHydrationWarning className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
          {activeTab === 'AI_RECOMMENDED' ? (
              <>
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-violet-300" />
                <p className="text-lg font-medium text-gray-600">AI đang học sở thích của bạn</p>
                <p className="text-sm mt-2">Hãy like và bình luận thêm để nhận gợi ý phù hợp hơn!</p>
              </>
            ) : (
              // Banner khám phá khi chưa follow ai
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <Users className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-700 mb-2">Feed của bạn đang trống</p>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                    {['SONG_XANH', 'TAM_LY_HOC', 'TINH_LANG', 'SANG_TAO'].includes(activeTab)
                      ? 'Những người bạn theo dõi chưa có bài viết ở chủ đề này.'
                      : 'Hãy theo dõi những người bạn quan tâm để thấy bài viết của họ xuất hiện ở đây.'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/explore"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold text-sm hover:bg-emerald-700 hover:-translate-y-0.5 transition-all shadow-sm"
                  >
                    <Compass className="w-4 h-4" />
                    Khám phá người dùng
                  </a>
                  <button
                    onClick={() => setActiveTab('AI_RECOMMENDED')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-violet-50 text-violet-700 border border-violet-200 rounded-full font-semibold text-sm hover:bg-violet-100 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Xem AI gợi ý
                  </button>
                </div>
                <p className="text-xs text-gray-300">Bài viết của bạn vẫn hiển thị cho người theo dõi bạn</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  id: post.id,
                  content: post.content,
                  image: post.imageUrl,
                  timestamp: new Date(post.createdAt).toLocaleDateString('vi-VN'),
                  likes: post._count.likes,
                  comments: post._count.comments,
                  reposts: (post._count as any).reposts ?? 0,
                  isLiked: post.isLiked,
                  repost: (post as any).repost ?? null,
                  author: {
                    id: post.author.id,
                    name: post.author.name,
                    handle: `@${post.author.email.split('@')[0]}`,
                    avatar: post.author.avatar || `https://i.pravatar.cc/100?u=${post.author.id}`,
                  }
                }}
              />
            ))}

            {nextCursor && (
              <button
                onClick={() => fetchPosts(nextCursor)}
                className="w-full py-3 text-emerald-700 font-bold border border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all"
              >
                Xem thêm
              </button>
            )}
          </div>
        )}
      </main>

      <RightSidebar />
    </div>
  )
}