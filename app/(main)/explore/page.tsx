'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Heart, MessageCircle, Bookmark, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

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

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Dành cho bạn')

  const categories = ['Dành cho bạn', 'Tĩnh lặng', 'Sống xanh', 'Sáng tạo', 'Tâm lý học']

  const fetchPosts = useCallback(async (category: string) => {
    const token = localStorage.getItem('accessToken')
    setLoading(true)
    try {
      const cat = categoryMap[category]
      const url = cat === 'DANH_CHO_BAN'
        ? '/api/posts?take=20'
        : `/api/posts?take=20&category=${cat}`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
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

  const filtered = posts.filter(p =>
    p.content.toLowerCase().includes(search.toLowerCase()) ||
    p.author.name.toLowerCase().includes(search.toLowerCase())
  )

  const featuredPost = filtered[0]
  const otherPosts = filtered.slice(1)

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (hours < 1) return 'Vừa xong'
    if (hours < 24) return `${hours} giờ trước`
    return `${days} ngày trước`
  }

  return (
    <main className="flex-1 p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

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
            <p className="text-sm mt-1">Hãy đăng bài với chủ đề này!</p>
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
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" /> {featuredPost._count.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" /> {featuredPost._count.comments}
                      </span>
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
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all"
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
                      <button className="flex items-center gap-1 text-xs hover:text-rose-500 transition-colors">
                        <Heart className="w-4 h-4" /> {post._count.likes}
                      </button>
                      <button className="flex items-center gap-1 text-xs hover:text-blue-500 transition-colors">
                        <MessageCircle className="w-4 h-4" /> {post._count.comments}
                      </button>
                    </div>
                    <button className="hover:text-emerald-600 transition-colors">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}