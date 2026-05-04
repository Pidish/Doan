'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, TrendingUp, X, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SuggestedUser {
  id: string
  name: string
  email: string
  avatar?: string
  _count: { followers: number }
}

interface SearchUser {
  id: string
  name: string
  email: string
  avatar?: string
  _count: { followers: number }
}

interface SearchPost {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; avatar?: string; email: string }
  _count: { likes: number; comments: number }
}

interface Trend {
  category: string
  tab: string
  label: string
  sublabel: string
  color: string
  countText: string
}

const STATIC_FALLBACK: Trend[] = [
  { category: 'SONG_XANH',  tab: 'SONG_XANH',  label: '#SongXanhMoiNgay',   sublabel: 'Thiên nhiên · Đang nổi',     color: 'text-emerald-600', countText: 'Khám phá ngay' },
  { category: 'TAM_LY_HOC', tab: 'TAM_LY_HOC', label: 'Tâm hồn & Cảm xúc', sublabel: 'Tâm hồn · Phổ biến',        color: 'text-violet-500',  countText: 'Khám phá ngay' },
  { category: 'TINH_LANG',  tab: 'TINH_LANG',  label: '#TinhLangNgayMoi',   sublabel: 'Tĩnh lặng · Đang được yêu', color: 'text-indigo-500',  countText: 'Khám phá ngay' },
]

export function RightSidebar() {
  const router = useRouter()
  const [users, setUsers] = useState<SuggestedUser[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  const [trends, setTrends] = useState<Trend[]>([])

  const [query, setQuery] = useState('')
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([])
  const [searchPosts, setSearchPosts] = useState<SearchPost[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Trending — no auth needed, runs independently
  useEffect(() => {
    fetch('/api/posts/trending')
      .then(r => r.json())
      .then(d => setTrends(d.trends?.length ? d.trends : STATIC_FALLBACK))
      .catch(() => setTrends(STATIC_FALLBACK))
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Parallel: me + users
    Promise.all([
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([meData, usersData]) => {
      const id = meData?.data?.id
      setCurrentUserId(id)
      setUsers(usersData?.data || [])

      if (id) {
        fetch(`/api/follow/${id}/following`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => {
            const ids = new Set<string>((d.data || []).map((u: { id: string }) => u.id))
            setFollowingIds(ids)
          })
          .catch(() => {})
      }
    }).catch(() => {})
  }, [])

  // Search with debounce + AbortController
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setSearchUsers([])
      setSearchPosts([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      // Cancel previous in-flight request
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      setSearching(true)
      try {
        const token = localStorage.getItem('accessToken')
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortRef.current.signal,
        })
        const data = await res.json()
        setSearchUsers(data.users || [])
        setSearchPosts(data.posts || [])
        setShowResults(true)
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') console.error(e)
      } finally {
        setSearching(false)
      }
    }, 350)
  }, [query])

  const handleFollow = async (userId: string) => {
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ followingId: userId })
      })
      const data = await res.json()
      if (res.ok) {
        setFollowingIds(prev => {
          const next = new Set(prev)
          data.following ? next.add(userId) : next.delete(userId)
          return next
        })
      }
    } catch {}
  }

  const suggested = users
    .filter(u => u.id !== currentUserId)
    .sort((a, b) => (followingIds.has(a.id) ? 1 : 0) - (followingIds.has(b.id) ? 1 : 0))
    .slice(0, 5)

  const hasResults = searchUsers.length > 0 || searchPosts.length > 0

  return (
    <aside className="hidden lg:flex flex-col w-[340px] h-screen fixed right-0 top-0 overflow-y-auto bg-gray-50/80 border-l border-gray-100">
      <div className="p-6 flex flex-col gap-6">

        {/* Search */}
        <div className="relative pt-4">
          <div className={`flex items-center bg-white rounded-2xl border transition-all px-4 py-3 gap-3 shadow-sm ${query ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-200 hover:border-gray-300'}`}>
            <Search className={`w-4 h-4 flex-shrink-0 transition-colors ${searching ? 'text-emerald-500 animate-pulse' : 'text-gray-400'}`} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 min-w-0"
            />
            {query && (
              <button onClick={() => { setQuery(''); setShowResults(false) }} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showResults && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-96 overflow-y-auto">
              {!hasResults ? (
                <p className="text-sm text-gray-400 text-center py-8">Không tìm thấy kết quả</p>
              ) : (
                <>
                  {searchUsers.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-4 pt-4 pb-2">Người dùng</p>
                      {searchUsers.map(u => (
                        <Link key={u.id} href={`/profile/${u.id}`} onClick={() => setShowResults(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                          <img src={u.avatar || `https://i.pravatar.cc/40?u=${u.id}`} alt={u.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400">@{u.email.split('@')[0]}</p>
                          </div>
                          <button onClick={e => { e.preventDefault(); handleFollow(u.id) }}
                            className={`text-xs font-bold px-3 py-1 rounded-full border transition-all flex-shrink-0 ${
                              followingIds.has(u.id)
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                            }`}>
                            {followingIds.has(u.id) ? 'Đã theo dõi' : 'Theo dõi'}
                          </button>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchPosts.length > 0 && (
                    <div className={searchUsers.length > 0 ? 'border-t border-gray-100' : ''}>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-4 pt-4 pb-2">Bài viết</p>
                      {searchPosts.map(post => (
                        <Link key={post.id} href={`/posts/${post.id}`} onClick={() => setShowResults(false)}
                          className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <img src={post.author.avatar || `https://i.pravatar.cc/28?u=${post.author.id}`}
                              alt={post.author.name} className="w-5 h-5 rounded-full object-cover" />
                            <span className="text-xs font-semibold text-gray-700">{post.author.name}</span>
                            <span className="text-xs text-gray-400 ml-auto">{post._count.likes} ❤️</span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{post.content}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Trending */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Xu hướng hôm nay
            </h4>
          </div>
          <div className="divide-y divide-gray-50">
            {trends.length === 0 ? (
              <div className="px-5 py-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse space-y-1.5">
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-2/5" />
                  </div>
                ))}
              </div>
            ) : trends.map((t) => (
              <button
                key={t.category}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('nexora:set-tab', { detail: t.tab }))
                  if (window.location.pathname !== '/home') router.push(`/home?tab=${t.tab}`)
                }}
                className="w-full text-left px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
              >
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{t.sublabel}</p>
                <p className={`font-bold text-sm ${t.color} group-hover:opacity-80 transition-opacity`}>{t.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.countText}</p>
              </button>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            <button
              onClick={() => router.push('/home')}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Xem thêm xu hướng
            </button>
          </div>
        </section>

        {/* Suggested Users */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Gợi ý kết nối
            </h4>
          </div>
          <div className="divide-y divide-gray-50">
            {suggested.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Không có gợi ý nào</p>
            ) : (
              suggested.map((user) => {
                const isFollowing = followingIds.has(user.id)
                return (
                  <div key={user.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <Link href={`/profile/${user.id}`} className="flex-shrink-0">
                      <img src={user.avatar || `https://i.pravatar.cc/48?u=${user.id}`} alt={user.name}
                        className="w-9 h-9 rounded-full object-cover hover:ring-2 hover:ring-emerald-300 transition-all" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${user.id}`}>
                        <p className="font-semibold text-xs text-gray-900 truncate hover:text-emerald-700 transition-colors">{user.name}</p>
                      </Link>
                      <p className="text-[11px] text-gray-400 truncate">@{user.email.split('@')[0]}</p>
                    </div>
                    <button onClick={() => handleFollow(user.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex-shrink-0 ${
                        isFollowing
                          ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-rose-500 hover:border-rose-500'
                          : 'text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                      }`}>
                      {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <footer className="px-1">
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
            {['Điều khoản', 'Bảo mật', 'Trợ giúp', 'Về chúng tôi'].map(l => (
              <a key={l} href="#" className="hover:text-emerald-600 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-[10px] text-gray-300 mt-2">© 2025 Nexora Vietnam</p>
        </footer>
      </div>
    </aside>
  )
}
