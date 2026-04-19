'use client'

import { useState, useEffect } from 'react'
import { PostCard } from '@/src/components/PostCard'
import { MapPin, Link as LinkIcon, Calendar, Loader2, Share2 } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  role: string
  createdAt: string
  _count: {
    posts: number
    followers: number
    following: number
  }
}

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

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      try {
        const userRes = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const userData = await userRes.json()
        setUser(userData.data)

        const postsRes = await fetch('/api/posts', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const postsData = await postsRes.json()
        const userPosts = postsData.data?.filter(
          (p: Post) => p.author.id === userData.data.id
        )
        setPosts(userPosts || [])
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="flex-1 min-h-screen bg-gray-50">

    {/* Cover */}
<div className="h-48 md:h-56 w-full bg-gradient-to-br from-teal-400 via-emerald-500 to-emerald-700 relative overflow-hidden">
  <div className="absolute inset-0 opacity-20"
    style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }}
  />
</div>

{/* Profile Info Card */}
<div className="max-w-5xl mx-auto px-6">
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 pt-0 pb-6 -mt-6 relative">

    {/* Avatar + Name + Buttons — nằm cùng hàng */}
    <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 mb-6">
      {/* Avatar */}
      <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg flex-shrink-0">
        <img
          src={user.avatar || `https://i.pravatar.cc/160?u=${user.id}`}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name + Buttons */}
      <div className="flex-1 flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-400 text-sm">@{user.email.split('@')[0]}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2 rounded-full bg-white text-gray-700 font-semibold text-sm border border-gray-200 hover:shadow-md transition-all">
            Chỉnh sửa hồ sơ
          </button>
          <button className="px-5 py-2 rounded-full bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-all flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Chia sẻ
          </button>
        </div>
      </div>
    </div>

    {/* Bio */}
    {user.bio && (
      <p className="text-gray-600 text-sm leading-relaxed mb-4 max-w-2xl">{user.bio}</p>
    )}

    {/* Meta */}
    <div className="flex flex-wrap gap-4 text-gray-400 text-sm mb-4">
      <span className="flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-emerald-500" /> Hà Nội, Việt Nam
      </span>
      <span className="flex items-center gap-1.5">
        <LinkIcon className="w-4 h-4 text-emerald-500" /> nexora.com/{user.email.split('@')[0]}
      </span>
      <span className="flex items-center gap-1.5">
        <Calendar className="w-4 h-4 text-emerald-500" />
        Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
      </span>
    </div>

    {/* Stats */}
    <div className="flex gap-6 text-sm">
      <span className="font-bold text-gray-900">{user._count.following} <span className="font-normal text-gray-400">Đang theo dõi</span></span>
      <span className="font-bold text-gray-900">{user._count.followers} <span className="font-normal text-gray-400">Người theo dõi</span></span>
    </div>
  </div>

        {/* Tabs + Content */}
        <div className="mt-6 flex gap-6">

          {/* Left — Posts */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 mb-4">
              <div className="flex gap-8">
                {[
                  { key: 'posts', label: 'Bài viết' },
                  { key: 'replies', label: 'Câu trả lời' },
                  { key: 'saved', label: 'Đã lưu' },
                  { key: 'liked', label: 'Đang thích' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts list */}
            <div className="flex flex-col gap-4">
              {posts.length === 0 ? (
                <div className="text-center py-20 text-gray-400 bg-white rounded-2xl">
                  <p className="font-medium">Chưa có bài viết nào</p>
                </div>
              ) : (
                posts.map((post) => (
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
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 w-72">

            {/* Khoảnh khắc */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Khoảnh khắc</h3>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden">
                    <img
                      src={`https://picsum.photos/seed/moment${i}/200/200`}
                      alt="Moment"
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Gợi ý kết nối */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Gợi ý cho bạn</h3>
              <div className="flex flex-col gap-3">
                {['Hoàng Nam', 'Linh Chi', 'Quốc An'].map((name, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img
                      src={`https://i.pravatar.cc/40?u=${i + 10}`}
                      alt={name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">@{name.toLowerCase().replace(' ', '_')}</p>
                    </div>
                    <button className="text-xs font-bold text-emerald-700 px-3 py-1 border border-emerald-200 rounded-full hover:bg-emerald-50 transition-all">
                      Theo dõi
                    </button>
                  </div>
                ))}
                <button className="text-emerald-600 text-sm font-semibold mt-2 hover:underline">
                  Xem thêm gợi ý
                </button>
              </div>
            </div>

            {/* Chủ đề thịnh hành */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Chủ đề thịnh hành</h3>
              <div className="flex flex-col gap-3">
                {[
                  { tag: '#SongXanhToiGian', count: '12.5k lượt' },
                  { tag: '#NexoraUpdate', count: '8.3k lượt' },
                  { tag: '#BinhYenMoiNgay', count: '6.1k lượt' },
                ].map((item, i) => (
                  <div key={i} className="cursor-pointer group">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Đang nổi</p>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{item.tag}</p>
                    <p className="text-xs text-gray-400">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}