'use client'

import { CURRENT_USER, MOCK_POSTS } from '@/src/constants'
import { PostCard } from '@/src/components/PostCard'
import { MapPin, Link as LinkIcon, Calendar } from 'lucide-react'

export default function ProfilePage() {
  return (
    <main className="flex-1 pt-20 min-h-screen">
      {/* Cover + Avatar */}
      <section className="relative w-full">
        <div className="h-64 md:h-80 w-full overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRo3m4_APovzW9AlZnuPBiROQxD7FcZpAGLp2fBHdRulbJyqEzEYw2r6i86FBTA-9c1_p2eD5Zh-tQCbWRjcpVCBWsCQq80gFsRolnYdFclb2n8DlP9CYf5KX3hwGu5IHgKPJLr6kCTFQSXoUgUI-UgJNr6zoU4EqQ1u17Irzhoz0niWWL40aeOOLPC-i9nHL5vJKqPai6uLVRbUsoacEIkRRNnJKoFVj7A2b1MDTJiLTqJe1ebZN8OUtr8sKxXv2udUIXUXz5NpHV"
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-6xl mx-auto px-8 relative">
          <div className="flex flex-col md:flex-row items-end gap-6 -mt-20 relative z-10">
            <div className="w-40 h-40 rounded-full border-8 border-white bg-white overflow-hidden shadow-xl">
              <img src={CURRENT_USER.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{CURRENT_USER.name}</h2>
                <p className="text-gray-500 font-medium">{CURRENT_USER.handle}</p>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-3 rounded-full bg-white text-emerald-700 font-bold shadow-sm hover:shadow-md border border-gray-200 transition-all active:scale-95">
                  Chỉnh sửa hồ sơ
                </button>
                <button className="px-6 py-3 rounded-full bg-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all active:scale-95">
                  Chia sẻ
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-lg leading-relaxed text-gray-700 max-w-2xl">
              {CURRENT_USER.bio}
            </p>
            <div className="flex flex-wrap gap-6 mt-6 text-gray-500 text-sm font-medium">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Hà Nội, Việt Nam
              </span>
              <span className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> nexora.com/minhanh
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Tham gia tháng 10, 2023
              </span>
            </div>
            <div className="flex gap-8 mt-6">
              <div className="flex gap-2 items-baseline">
                <span className="font-bold text-xl text-gray-900">1,248</span>
                <span className="text-gray-500 text-sm">Đang theo dõi</span>
              </div>
              <div className="flex gap-2 items-baseline">
                <span className="font-bold text-xl text-gray-900">52.4K</span>
                <span className="text-gray-500 text-sm">Người theo dõi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-8 mt-12">
        <div className="flex gap-12 border-b border-gray-200">
          <button className="pb-4 border-b-2 border-emerald-700 text-emerald-700 font-bold">Bài viết</button>
          <button className="pb-4 text-gray-400 font-medium hover:text-gray-700 transition-colors">Câu trả lời</button>
          <button className="pb-4 text-gray-400 font-medium hover:text-gray-700 transition-colors">Đã lưu</button>
          <button className="pb-4 text-gray-400 font-medium hover:text-gray-700 transition-colors">Đang thích</button>
        </div>
      </div>

      {/* Posts + Moments */}
      <section className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 flex flex-col gap-12">
          {MOCK_POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-emerald-50 rounded-2xl p-6">
            <h3 className="font-bold text-emerald-900 text-lg mb-6">Khoảnh khắc</h3>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white">
                  <img
                    src={`https://picsum.photos/seed/moment${i}/400/400`}
                    alt="Moment"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}