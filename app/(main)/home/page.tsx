'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PostCard } from '@/src/components/PostCard'
import { RightSidebar } from '@/src/components/RightSidebar'
import { motion } from 'framer-motion'
import { Loader2, PenSquare } from 'lucide-react'

interface Post {
  id: string
  content: string
  imageUrl?: string
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

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar?: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'FOR_YOU' | 'FOLLOWING' | 'SONG_XANH' | 'TAM_LY_HOC'>('FOR_YOU')

  // ✅ Lấy token từ localStorage sau khi mount
  useEffect(() => {
    const t = localStorage.getItem('accessToken')
    setToken(t)
  }, [])

  // ✅ Fetch posts theo tab
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
      if (currentTab === 'FOLLOWING') {
        url = `/api/posts/feed?userId=${userId ?? currentUser?.id ?? ''}`
      } else if (currentTab === 'SONG_XANH') {
        url = cursor ? `/api/posts?category=SONG_XANH&cursor=${cursor}` : '/api/posts?category=SONG_XANH'
      } else if (currentTab === 'TAM_LY_HOC') {
        url = cursor ? `/api/posts?category=TAM_LY_HOC&cursor=${cursor}` : '/api/posts?category=TAM_LY_HOC'
      } else {
        url = cursor ? `/api/posts?cursor=${cursor}` : '/api/posts'
      }

      const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } })
      const data = await res.json()
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

  useEffect(() => {
    const t = localStorage.getItem('accessToken')
    setToken(t)
    if (t) {
      fetch('/api/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(d => {
          setCurrentUser(d.data)
          fetchPosts(undefined, t, 'FOR_YOU', d.data?.id)
        })
        .catch(() => fetchPosts(undefined, t, 'FOR_YOU'))
    }
  }, [])

  // Reload khi đổi tab
  useEffect(() => {
    if (token && currentUser) {
      setPosts([])
      fetchPosts(undefined, token, activeTab, currentUser.id)
    }
  }, [activeTab])

  // ✅ Tạo post với token từ state
  const handleCreatePost = async () => {
  if (!newPost.trim()) return
  setPosting(true)
  setError('')

  // ✅ Lấy thẳng từ localStorage, không dùng state
  const t = localStorage.getItem('accessToken')

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`
      },
      body: JSON.stringify({ content: newPost })
    })

    const data = await res.json()

    if (res.ok) {
      setPosts(prev => [data.data, ...prev])
      setNewPost('')
    } else {
      setError(data.error || 'Không thể đăng bài')
    }
  } catch {
    setError('Không thể kết nối server')
  } finally {
    setPosting(false)
  }
}

  return (
    <div className="flex">
      <main className="flex-1 mr-0 lg:mr-[350px] p-6 md:p-10">

        {/* Banner */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 p-10 flex items-center min-h-[280px]"
        >
          <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-extrabold text-emerald-900 leading-tight mb-4">
              Chào buổi sáng, <br />Người bạn tinh thần
            </h2>
            <p className="text-emerald-800/80 text-lg leading-relaxed">
              Hôm nay hãy cùng dành một chút thời gian để hít thở và kết nối với cộng đồng yên bình của chúng ta.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO5bVeWn0qQLFQRgnV8vWrjaHqPpFJcVxYNyTCwJQwXpvJMJ4558NhbZr2V0vWDc3IKvw6gTTi_KmWCiMJoL7SQqoGTI5tn5wizM2Y8DyrykGM2ZszM24jmu5tCeK9r9JSvgvIYS808fminLcqhX89PFjkR0AAxNnZrUD7fEE7RVdxg57_L5HFPbA_dfWnCJ_GItZTe68olXPpTnMCsoyl9XnwcYOQunqfNN_oxjS4WXG-Kr0i8eq8OLUjWqDte_TjC3AmDECEPsGN"
            alt="Nature"
            className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-60 mix-blend-overlay hidden md:block"
          />
        </motion.section>

        {/* Tạo post mới */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex gap-4">
            <Link href="/profile" className="flex-shrink-0">
              <img
                src={currentUser?.avatar || `https://i.pravatar.cc/40?u=me`}
                alt={currentUser?.name || 'avatar'}
                className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer"
              />
            </Link>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder="Bạn đang nghĩ gì vậy?"
                className="w-full bg-gray-50 rounded-2xl p-4 text-gray-900 placeholder:text-gray-400 resize-none outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                rows={3}
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleCreatePost}
                  disabled={posting || !newPost.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 text-white rounded-full font-bold text-sm hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {posting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><PenSquare className="w-4 h-4" /> Đăng bài</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {(() => {
          const tabs = [
            { key: 'FOR_YOU', label: 'Dành cho bạn' },
            { key: 'FOLLOWING', label: 'Đang theo dõi' },
            { key: 'SONG_XANH', label: 'Thiên nhiên' },
            { key: 'TAM_LY_HOC', label: 'Tâm hồn' },
          ] as const
          return (
            <div className="flex gap-8 mb-8 overflow-x-auto pb-2 border-b border-gray-100">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'text-emerald-700 font-bold after:content-[\'\'] after:absolute after:-bottom-[1px] after:left-0 after:w-full after:h-0.5 after:bg-emerald-700 after:rounded-full'
                      : 'text-gray-400 hover:text-emerald-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )
        })()}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">
              {activeTab === 'FOLLOWING' ? 'Chưa có bài viết từ người bạn theo dõi' : 'Chưa có bài viết nào'}
            </p>
            <p className="text-sm mt-2">
              {activeTab === 'FOLLOWING' ? 'Hãy theo dõi thêm người dùng để xem bài viết của họ!' : 'Hãy là người đầu tiên chia sẻ!'}
            </p>
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