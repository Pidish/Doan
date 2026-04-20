'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp } from 'lucide-react'

interface SuggestedUser {
  id: string
  name: string
  email: string
  avatar?: string
  _count: { followers: number }
  isFollowing: boolean
}

export function RightSidebar() {
  const [users, setUsers] = useState<SuggestedUser[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Fetch current user
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setCurrentUserId(d.data?.id)

        // Fetch danh sách đang theo dõi
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

    // Fetch danh sách user gợi ý
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setUsers(d.data || []))
      .catch(() => {})
  }, [])

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

  // Lọc bỏ bản thân, ưu tiên người chưa theo dõi, lấy tối đa 5
  const suggested = users
    .filter(u => u.id !== currentUserId)
    .sort((a, b) => (followingIds.has(a.id) ? 1 : 0) - (followingIds.has(b.id) ? 1 : 0))
    .slice(0, 5)

  return (
    <aside className="hidden lg:flex flex-col w-[350px] h-screen fixed right-0 top-0 p-10 gap-10 overflow-y-auto bg-white border-l border-gray-100">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm cảm hứng..."
          className="w-full bg-gray-100 border-none rounded-full py-4 pl-14 pr-6 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-gray-400"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
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
