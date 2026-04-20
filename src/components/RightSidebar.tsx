'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, TrendingUp, X } from 'lucide-react'

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
  bio?: string
  _count: { followers: number }
}

interface SearchPost {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; avatar?: string; email: string }
  _count: { likes: number; comments: number }
}

export function RightSidebar() {
  const [users, setUsers] = useState<SuggestedUser[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  const [query, setQuery] = useState('')
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([])
  const [searchPosts, setSearchPosts] = useState<SearchPost[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setCurrentUserId(d.data?.id)
        return fetch(`/api/follow/${d.data?.id}/following`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      })
      .then(r => r.json())
      .then(d => {
        const ids = new Set<string>((d.data || []).map((u: { id: string }) => u.id))
        setFollowingIds(ids)
      })
      .catch(() => {})

    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setUsers(d.data || []))
      .catch(() => {})
  }, [])

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setSearchUsers([])
      setSearchPosts([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const token = localStorage.getItem('accessToken')
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setSearchUsers(data.users || [])
        setSearchPosts(data.posts || [])
        setShowResults(true)
      } catch {}
      finally { setSearching(false) }
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
    <aside className="hidden lg:flex flex-col w-[350px] h-screen fixed right-0 top-0 p-10 gap-10 overflow-y-auto bg-white border-l border-gray-100">

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm kiếm người dùng, bài viết..."
          className="w-full bg-gray-100 border-none rounded-full py-4 pl-14 pr-10 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-gray-400"
        />
        <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searching ? 'text-emerald-500 animate-pulse' : 'text-gray-400'}`} />
        {query && (
          <button onClick={() => { setQuery(''); setShowResults(false) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown kết quả */}
        {showResults && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-96 overflow-y-auto">
            {!hasResults ? (
              <p className="text-sm text-gray-400 text-center py-6">Không tìm thấy kết quả nào</p>
            ) : (
              <>
                {/* Users */}
                {searchUsers.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-4 pt-4 pb-2">Người dùng</p>
                    {searchUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <img
                          src={u.avatar || `https://i.pravatar.cc/40?u=${u.id}`}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">@{u.email.split('@')[0]}</p>
                        </div>
                        <button
                          onClick={() => handleFollow(u.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex-shrink-0 ${
                            followingIds.has(u.id)
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-700 hover:text-white'
                          }`}
                        >
                          {followingIds.has(u.id) ? 'Đang theo dõi' : 'Theo dõi'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Posts */}
                {searchPosts.length > 0 && (
                  <div className={searchUsers.length > 0 ? 'border-t border-gray-100' : ''}>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-4 pt-4 pb-2">Bài viết</p>
                    {searchPosts.map(post => (
                      <div key={post.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <img
                            src={post.author.avatar || `https://i.pravatar.cc/28?u=${post.author.id}`}
                            alt={post.author.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-semibold text-gray-700">{post.author.name}</span>
                          <span className="text-xs text-gray-400">· {post._count.likes} ❤️ {post._count.comments} 💬</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Trending */}
      <section className="bg-emerald-50 rounded-2xl p-8">
        <h4 className="font-bold text-xl text-emerald-700 mb-6 flex items-center justify-between">
          Xu hướng hôm nay
          <TrendingUp className="text-emerald-700/50 w-5 h-5" />
        </h4>
        <div className="flex flex-col gap-6">
          <div className="group cursor-pointer">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Cảm hứng • Đang nổi</p>
            <h5 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">#SongXanhMoiNgay</h5>
            <p className="text-sm text-gray-400 mt-1">15.4k lượt thảo luận</p>
          </div>
          <div className="group cursor-pointer">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Thiền định • Phổ biến</p>
            <h5 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">Hơi thở ban mai</h5>
            <p className="text-sm text-gray-400 mt-1">8.2k người đang nghe</p>
          </div>
        </div>
        <button className="mt-8 text-emerald-700 text-sm font-bold hover:underline">Xem thêm</button>
      </section>

      {/* Suggested Users */}
      <section>
        <h4 className="font-bold text-xl text-emerald-700 mb-6">Gợi ý kết nối</h4>
        <div className="flex flex-col gap-6">
          {suggested.length === 0 ? (
            <p className="text-sm text-gray-400">Không có gợi ý nào</p>
          ) : (
            suggested.map((user) => {
              const isFollowing = followingIds.has(user.id)
              return (
                <div key={user.id} className="flex items-center gap-4">
                  <img
                    src={user.avatar || `https://i.pravatar.cc/48?u=${user.id}`}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-sm text-gray-900 leading-none truncate">{user.name}</h5>
                    <p className="text-xs text-gray-400 mt-1 truncate">@{user.email.split('@')[0]}</p>
                  </div>
                  <button
                    onClick={() => handleFollow(user.id)}
                    className={`text-xs font-bold px-4 py-2 rounded-full border transition-all flex-shrink-0 ${
                      isFollowing
                        ? 'bg-emerald-700 text-white border-emerald-700 hover:bg-red-500 hover:border-red-500'
                        : 'text-emerald-700 border-emerald-200 hover:bg-emerald-700 hover:text-white'
                    }`}
                  >
                    {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-10 border-t border-gray-100">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          <a href="#" className="hover:text-emerald-700">Điều khoản</a>
          <a href="#" className="hover:text-emerald-700">Bảo mật</a>
          <a href="#" className="hover:text-emerald-700">Trợ giúp</a>
        </div>
        <p className="text-[10px] text-gray-400 mt-4">© 2024 NEXORA VIETNAM</p>
      </footer>
    </aside>
  )
}
