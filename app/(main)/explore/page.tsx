'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Heart, MessageCircle, Bookmark, Loader2, X, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Post {
  id: string
  content: string
  imageUrl?: string
  category?: string
  createdAt: string
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

const categoryMap: Record<string, string> = {
  'Dành cho bạn': 'DANH_CHO_BAN',
  'Tĩnh lặng': 'TINH_LANG',
  'Sống xanh': 'SONG_XANH',
  'Sáng tạo': 'SANG_TAO',
  'Tâm lý học': 'TAM_LY_HOC',
}

function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-1">Tham gia Nexora</h2>
        <p className="text-gray-400 text-sm mb-6">
          Đăng ký để thích, bình luận và kết nối với mọi người trong cộng đồng.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/register"
            className="w-full py-3 bg-emerald-600 text-white rounded-full text-center font-bold hover:bg-emerald-700 transition-colors"
          >
            Đăng ký miễn phí
          </Link>
          <Link
            href="/login"
            className="w-full py-3 border border-gray-200 text-gray-700 rounded-full text-center font-semibold hover:bg-gray-50 transition-colors"
          >
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-xs text-gray-300 hover:text-gray-500 transition-colors"
        >
          Tiếp tục xem không đăng nhập
        </button>
      </motion.div>
    </motion.div>
  )
}

// Reverse map: API category code → display name
const categoryCodeToName: Record<string, string> = Object.fromEntries(
  Object.entries(categoryMap).map(([k, v]) => [v, k])
)

export default function ExplorePage() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isGuest] = useState(() =>
    typeof window !== 'undefined' ? !window.localStorage.getItem('accessToken') : false
  )

  const categories = ['Dành cho bạn', 'Tĩnh lặng', 'Sống xanh', 'Sáng tạo', 'Tâm lý học']

  // Pre-select category from ?category= query param (e.g. from trending sidebar)
  const initialCategory = (() => {
    const code = searchParams?.get('category')
    return code ? (categoryCodeToName[code] ?? 'Dành cho bạn') : 'Dành cho bạn'
  })()
  const [activeCategory, setActiveCategory] = useState(initialCategory)

  const fetchPosts = useCallback(async (category: string) => {
    setLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const cat = categoryMap[category]
      const url = cat === 'DANH_CHO_BAN'
        ? '/api/posts?take=20'
        : `/api/posts?take=20&category=${cat}`

      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(url, { headers })
      const data = await res.json()
      setPosts(data.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(activeCategory)
  }, [activeCategory, fetchPosts])

  const handleGuestInteract = () => setShowLoginModal(true)

  const filtered = posts.filter(p =>
    p.content.toLowerCase().includes(search.toLowerCase()) ||
    p.author.name.toLowerCase().includes(search.toLowerCase())
  )

  const featuredPost = filtered[0]
  const otherPosts = filtered.slice(1)

  const timeAgo = (date: string) => {
    if (!date) return 'vừa xong'
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return 'vừa xong'
    const diff = Date.now() - parsed.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (hours < 1) return 'vừa xong'
    if (hours < 24) return `${hours} giờ trước`
    return `${days} ngày trước`
  }

  return (
    <main className="flex-1 p-6 md:p-10 bg-gray-50 min-h-screen">
      <AnimatePresence>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">

        {/* Guest banner */}
        {isGuest && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between gap-4 bg-emerald-700 text-white px-6 py-4 rounded-2xl shadow-sm"
          >
            <div>
              <p className="font-bold text-sm">Bạn đang xem với tư cách khách</p>
              <p className="text-emerald-200 text-xs mt-0.5">Đăng ký để thích, bình luận và đăng bài viết</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/login" className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-full text-xs font-semibold transition-colors">
                Đăng nhập
              </Link>
              <Link href="/register" className="px-4 py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-full text-xs font-bold transition-colors">
                Đăng ký
              </Link>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-emerald-700"></span>
            Khám phá cảm hứng mới
          </h2>
          <div className="relative w-64 hidden md:block">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </header>

        {/* Categories */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-emerald-800 border border-emerald-100 hover:bg-emerald-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Không tìm thấy bài viết nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Featured Post */}
            {featuredPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 group relative h-80 rounded-2xl overflow-hidden shadow-sm cursor-pointer"
              >
                {featuredPost.imageUrl ? (
                  <img
                    src={featuredPost.imageUrl}
                    alt="Featured"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 to-transparent flex items-end p-8">
                  <div className="max-w-md text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={featuredPost.author.avatar || `https://i.pravatar.cc/24?u=${featuredPost.author.id}`}
                        className="w-6 h-6 rounded-full object-cover"
                        alt={featuredPost.author.name}
                      />
                      <span className="text-sm font-medium opacity-80">{featuredPost.author.name}</span>
                      {featuredPost.category && (
                        <span className="ml-2 text-[10px] px-2 py-0.5 bg-white/20 rounded-full uppercase tracking-wider">
                          {Object.keys(categoryMap).find(k => categoryMap[k] === featuredPost.category)}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold leading-snug mb-4 line-clamp-3">
                      {featuredPost.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm opacity-70">
                      <button
                        onClick={isGuest ? handleGuestInteract : undefined}
                        className="flex items-center gap-1 hover:opacity-100 transition-opacity"
                      >
                        <Heart className="w-4 h-4" /> {featuredPost._count.likes}
                      </button>
                      <button
                        onClick={isGuest ? handleGuestInteract : undefined}
                        className="flex items-center gap-1 hover:opacity-100 transition-opacity"
                      >
                        <MessageCircle className="w-4 h-4" /> {featuredPost._count.comments}
                      </button>
                      <span>{timeAgo(featuredPost.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other Posts */}
            {otherPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                {post.imageUrl ? (
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-6">
                    <p className="text-emerald-800 font-medium text-center line-clamp-4 leading-relaxed text-sm">
                      {post.content}
                    </p>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={post.author.avatar || `https://i.pravatar.cc/24?u=${post.author.id}`}
                      className="w-6 h-6 rounded-full object-cover"
                      alt={post.author.name}
                    />
                    <span className="text-xs font-medium text-gray-600">{post.author.name}</span>
                    {post.category && (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full ml-1">
                        {Object.keys(categoryMap).find(k => categoryMap[k] === post.category)}
                      </span>
                    )}
                    <span className="text-xs text-gray-300 ml-auto">{timeAgo(post.createdAt)}</span>
                  </div>

                  {post.imageUrl && (
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mb-3">
                      {post.content}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-gray-400 mt-3">
                    <div className="flex gap-3">
                      <button
                        onClick={isGuest ? handleGuestInteract : undefined}
                        className="flex items-center gap-1 text-xs hover:text-rose-500 transition-colors"
                      >
                        <Heart className="w-4 h-4" /> {post._count.likes}
                      </button>
                      <button
                        onClick={isGuest ? handleGuestInteract : undefined}
                        className="flex items-center gap-1 text-xs hover:text-blue-500 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> {post._count.comments}
                      </button>
                    </div>
                    <button
                      onClick={isGuest ? handleGuestInteract : undefined}
                      className="hover:text-emerald-600 transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Guest CTA bottom */}
        {isGuest && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center py-10 border-t border-gray-200"
          >
            <p className="text-gray-500 font-semibold mb-1">Bạn đã thích những gì mình thấy?</p>
            <p className="text-gray-400 text-sm mb-5">Đăng ký để tham gia cộng đồng và tương tác với mọi người</p>
            <div className="flex gap-3 justify-center">
              <Link href="/register" className="px-6 py-2.5 bg-emerald-600 text-white rounded-full font-bold text-sm hover:bg-emerald-700 transition-colors">
                Đăng ký miễn phí
              </Link>
              <Link href="/login" className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-full font-semibold text-sm hover:bg-gray-50 transition-colors">
                Đăng nhập
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
