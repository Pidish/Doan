'use client'

import { Search, TrendingUp } from 'lucide-react'
import { SUGGESTED_USERS } from '../constants'

export function RightSidebar() {
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
          {SUGGESTED_USERS.map((user) => (
            <div key={user.id} className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h5 className="font-bold text-sm text-gray-900 leading-none">{user.name}</h5>
                <p className="text-xs text-gray-400 mt-1">{user.role}</p>
              </div>
              <button className="text-xs font-bold text-emerald-700 px-4 py-2 border border-emerald-200 rounded-full hover:bg-emerald-700 hover:text-white transition-all">
                Theo dõi
              </button>
            </div>
          ))}
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