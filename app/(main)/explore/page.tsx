'use client'

import { Sidebar } from '@/src/components/Sidebar'
import { Search, Heart, MessageCircle, Bookmark } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ExplorePage() {
  const categories = ['Dành cho bạn', 'Tĩnh lặng', 'Sống xanh', 'Sáng tạo', 'Tâm lý học']

  return (
    <main className="flex-1 p-6 md:p-10 pt-24 md:pt-10">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold text-emerald-700 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-emerald-700"></span> Khám phá cảm hứng mới
          </h2>
          <div className="relative w-64 hidden md:block">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </header>

        <div className="flex items-center gap-6 overflow-x-auto pb-4 mb-10">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={i === 0
                ? "px-6 py-2 bg-emerald-700 text-white rounded-full font-medium whitespace-nowrap"
                : "px-6 py-2 bg-emerald-100 text-emerald-900 rounded-full font-medium whitespace-nowrap hover:bg-emerald-200 transition-colors"
              }
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 group relative h-80 rounded-2xl overflow-hidden shadow-sm"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqFkKHvwOsFYGCZukDgdf2BSxZkYEPVE9yL8RrvIFmUk3LceRG3DImvUsA-jXtMj9S3yQL37M1E9Y1i0iEE5SxvWXorlMGXk8zbTuochKe96TqQlymIwfGhWQDYEE_ro16buY0vzaRTS2-MwFHuvUbYgLcdgSOTqN7n6Zybdomsp5s9ltEUIa4V6THmwtAk-eYdzi3YdnOVz42vC5iakIUxaR8e-wqDzZbu-DruaoyI87rVE5BYLlmEHWK92-S3mtJECNPKi_NzpG7"
              alt="Creative"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 to-transparent flex items-center p-12">
              <div className="max-w-md text-white">
                <span className="px-3 py-1 bg-emerald-800/60 text-white text-[10px] rounded-full font-bold mb-6 inline-block uppercase tracking-wider">Sáng tạo</span>
                <h3 className="text-3xl font-bold mb-4 leading-tight">Khám phá tư duy thiết kế bền vững cho tương lai số</h3>
                <button className="bg-white text-emerald-900 px-8 py-3 rounded-full font-bold text-sm hover:bg-emerald-50 transition-colors">Đọc bài viết</button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="aspect-square relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2U1PpmX3Ucgx1yItOUKuzhaN_xuZPAoyR42F-adTzpdz2al5gy2UtReMnkYdjhMxCvjTIOOwJZ9QzAa6RynXCm2X35KlCACgmNy65XrzSRBcdGb1bZCO1HBtG5ZuZc2CtwMyjqiOa5fs0SLqHHkYNqJp2oRBHAe9TgGbTAXkkHMRicHAQtxEdmRHQf-W0uu9a06RY0NOFeK0TC4U-m4cRV6Qe9SsxqdKcf48cUGlFqEGeFUeJMND1o1f8zDMimZ_2n50jOvvSb-dy"
                alt="Eco"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <span className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] rounded-full border border-white/20">Sống xanh</span>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-3 leading-tight group-hover:text-emerald-700 transition-colors">Góc ban công xanh - Lá phổi nhỏ của căn hộ phố</h3>
              <div className="flex items-center justify-between mt-6">
                <div className="flex gap-4 text-gray-400">
                  <Heart className="w-4 h-4" />
                  <MessageCircle className="w-4 h-4" />
                </div>
                <Bookmark className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}