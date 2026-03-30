'use client'

import { MOCK_POSTS } from '@/src/constants'
import { PostCard } from '@/src/components/PostCard'
import { RightSidebar } from '@/src/components/RightSidebar'
import { motion } from 'framer-motion'

export default function HomePage() {
  return (
    <div className="flex">
      <main className="flex-1 mr-0 lg:mr-[350px] p-6 md:p-10 pt-24 md:pt-10">
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-16 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 p-10 flex items-center min-h-[320px]"
        >
          <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-extrabold text-emerald-900 leading-tight mb-4">
              Chào buổi sáng, <br />Người bạn tinh thần
            </h2>
            <p className="text-emerald-800/80 text-lg leading-relaxed mb-8">
              Hôm nay hãy cùng dành một chút thời gian để hít thở và kết nối với cộng đồng yên bình của chúng ta.
            </p>
            <button className="bg-emerald-700 text-white px-8 py-3 rounded-full font-semibold hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95">
              Bắt đầu ngày mới
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO5bVeWn0qQLFQRgnV8vWrjaHqPpFJcVxYNyTCwJQwXpvJMJ4558NhbZr2V0vWDc3IKvw6gTTi_KmWCiMJoL7SQqoGTI5tn5wizM2Y8DyrykGM2ZszM24jmu5tCeK9r9JSvgvIYS808fminLcqhX89PFjkR0AAxNnZrUD7fEE7RVdxg57_L5HFPbA_dfWnCJ_GItZTe68olXPpTnMCsoyl9XnwcYOQunqfNN_oxjS4WXG-Kr0i8eq8OLUjWqDte_TjC3AmDECEPsGN"
            alt="Nature illustration"
            className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-60 mix-blend-overlay hidden md:block"
          />
        </motion.section>

        <div className="flex gap-8 mb-12 overflow-x-auto pb-2">
          <button className="text-emerald-700 font-bold relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-1/2 after:h-1 after:bg-emerald-700 after:rounded-full">
            Dành cho bạn
          </button>
          <button className="text-gray-400 font-medium hover:text-emerald-700 transition-colors">Đang theo dõi</button>
          <button className="text-gray-400 font-medium hover:text-emerald-700 transition-colors">Thiên nhiên</button>
          <button className="text-gray-400 font-medium hover:text-emerald-700 transition-colors">Tâm hồn</button>
        </div>

        <div className="flex flex-col gap-10">
          {MOCK_POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>

      <RightSidebar />
    </div>
  )
}