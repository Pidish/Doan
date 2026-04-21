'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PostCard } from '@/src/components/PostCard'
import { MapPin, Calendar, Loader2, X, UserCheck, Heart, UserPlus, UserMinus } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  role: string
  createdAt: string
  _count: { posts: number; followers: number; following: number }
}

interface Post {
  id: string
  content: string
  imageUrl?: string
  createdAt: string
  author: { id: string; name: string; email: string; avatar?: string }
  _count: { likes: number; comments: number }
}

interface PersonUser {
  id: string
  name: string
  email: string
  avatar?: string
}

type ModalType = 'followers' | 'following' | null

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)

  const [modal, setModal] = useState<ModalType>(null)
  const [modalUsers, setModalUsers] = useState<PersonUser[]>([])
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const token = localStorage.getItem('accessToken')
    if (!token) { router.push('/login'); return }

    const fetchAll = async () => {
      try {
        const [meRes, userRes, postsRes] = await Promise.all([
          fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/users/${id}/posts`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const [meData, userData, postsData] = await Promise.all([
          meRes.json(), userRes.json(), postsRes.json()
        ])

        const me = meData.data
        setCurrentUserId(me?.id ?? null)

        if (userData.id) {
          // redirect own profile
          if (me?.id === userData.id) { router.replace('/profile'); return }
          setUser({ ...userData, role: userData.role ?? 'USER' })
          setFollowerCount(userData._count?.followers ?? 0)

          // check if following
          const followRes = await fetch(`/api/follow/${userData.id}/followers`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const followData = await followRes.json()
          const followers: PersonUser[] = followData.data || []
          setIsFollowing(followers.some(f => f.id === me?.id))
        }

        const rawPosts: Post[] = Array.isArray(postsData) ? postsData : (postsData.data || [])
        setPosts(rawPosts.map(p => ({
          ...p,
          author: p.author ?? { id: userData.id, name: userData.name, email: userData.email, avatar: userData.avatar }
        })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  const handleFollow = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token || !user) return
    setFollowLoading(true)
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ followingId: user.id })
      })
      const data = await res.json()
      if (res.ok) {
        setIsFollowing(data.following)
        setFollowerCount(prev => data.following ? prev + 1 : prev - 1)
      }
    } finally {
      setFollowLoading(false)
    }
  }

  const openModal = async (type: ModalType) => {
    if (!user || !type) return
    setModal(type)
    setModalLoading(true)
    setModalUsers([])
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`/api/follow/${user.id}/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setModalUsers(data.data || [])
    } catch {}
    finally { setModalLoading(false) }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
    </div>
  )

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
      <p>Không tìm thấy người dùng</p>
      <button onClick={() => router.back()} className="mt-4 text-emerald-600 hover:underline">Quay lại</button>
    </div>
  )

  return (
    <main className="flex-1 min-h-screen bg-gray-50">

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                {modal === 'followers'
                  ? <><UserCheck className="w-5 h-5 text-emerald-600" /> Người theo dõi ({followerCount})</>
                  : <><Heart className="w-5 h-5 text-rose-500" /> Đang theo dõi ({user._count.following})</>
                }
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              {modalLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : modalUsers.length === 0 ? (
                <p className="text-center py-10 text-gray-400 text-sm">Chưa có ai</p>
              ) : (
                modalUsers.map(u => (
                  <Link key={u.id} href={`/profile/${u.id}`} onClick={() => setModal(null)}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                    <img
                      src={u.avatar || `https://i.pravatar.cc/40?u=${u.id}`}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">@{u.email.split('@')[0]}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cover */}
      <div className="h-48 md:h-56 w-full bg-gradient-to-br from-teal-400 via-emerald-500 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 pt-0 pb-6 -mt-6 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg flex-shrink-0">
              <img
                src={user.avatar || `https://i.pravatar.cc/160?u=${user.id}`}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col md:flex-row justify-between md:items-center gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-400 text-sm">@{user.email.split('@')[0]}</p>
              </div>
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${
                  isFollowing
                    ? 'bg-white text-gray-700 border border-gray-200 hover:border-rose-300 hover:text-rose-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  isFollowing
                    ? <><UserMinus className="w-4 h-4" /> Đang theo dõi</>
                    : <><UserPlus className="w-4 h-4" /> Theo dõi</>
                }
              </button>
            </div>
          </div>

          {user.bio && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4 max-w-2xl">{user.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-gray-400 text-sm mb-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-500" /> Hà Nội, Việt Nam
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="flex gap-6 text-sm">
            <button onClick={() => openModal('following')} className="font-bold text-gray-900 hover:text-emerald-700 transition-colors">
              {user._count.following} <span className="font-normal text-gray-400">Đang theo dõi</span>
            </button>
            <button onClick={() => openModal('followers')} className="font-bold text-gray-900 hover:text-emerald-700 transition-colors">
              {followerCount} <span className="font-normal text-gray-400">Người theo dõi</span>
            </button>
            <span className="font-bold text-gray-900">
              {user._count.posts} <span className="font-normal text-gray-400">Bài viết</span>
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-col gap-4">
            {posts.length === 0 ? (
              <div className="text-center py-20 text-gray-400 bg-white rounded-2xl">
                <p className="font-medium">Chưa có bài viết nào</p>
              </div>
            ) : (
              posts.map(post => (
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
                      handle: `@${post.author.email?.split('@')[0] ?? ''}`,
                      avatar: post.author.avatar || `https://i.pravatar.cc/100?u=${post.author.id}`,
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
