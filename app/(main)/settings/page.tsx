'use client'

import { User, Shield, Bell, Eye, Palette, HelpCircle, LogOut, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  const menuItems = [
    { icon: User, label: 'Chỉnh sửa hồ sơ', desc: 'Tên, ảnh đại diện, tiểu sử' },
    { icon: Palette, label: 'Giao diện', desc: 'Chế độ tối, màu sắc chủ đạo', active: true },
    { icon: Shield, label: 'Bảo mật & Mật khẩu', desc: 'Xác thực 2 lớp, đổi mật khẩu' },
    { icon: Eye, label: 'Quyền riêng tư', desc: 'Ai có thể xem bài viết của bạn' },
    { icon: Bell, label: 'Thông báo', desc: 'Đẩy, Email, SMS' },
    { icon: HelpCircle, label: 'Trợ giúp & Hỗ trợ', desc: 'Trung tâm trợ giúp, báo cáo lỗi' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/login')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-12 p-6 md:p-10 pt-24 md:pt-10">
      {/* Menu */}
      <section className="lg:w-1/3 space-y-8">
        <h2 className="text-3xl font-bold text-emerald-950">Cài đặt</h2>

        <div className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-4 p-5 rounded-2xl transition-all group ${
                item.active
                  ? 'bg-emerald-700 text-white shadow-lg'
                  : 'hover:bg-emerald-50 text-gray-900'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                item.active ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-sm">{item.label}</h4>
                <p className={`text-[11px] ${item.active ? 'text-white/70' : 'text-gray-400'}`}>
                  {item.desc}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 p-5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all w-full"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
            <LogOut className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm">Đăng xuất</span>
        </button>
      </section>

      {/* Content */}
      <section className="lg:w-2/3 space-y-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100"
        >
          <h3 className="text-2xl font-bold text-emerald-950 mb-10">Giao diện</h3>

          <div className="space-y-12">
            {/* Theme Mode */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Chế độ hiển thị</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-3 cursor-pointer">
                  <div className="aspect-video bg-white rounded-2xl border-4 border-emerald-700 shadow-sm flex items-center justify-center">
                    <div className="w-1/2 h-2 bg-gray-200 rounded-full"></div>
                  </div>
                  <p className="text-center text-sm font-bold text-emerald-700">Sáng</p>
                </div>
                <div className="space-y-3 cursor-pointer">
                  <div className="aspect-video bg-stone-900 rounded-2xl border-2 border-gray-200 flex items-center justify-center">
                    <div className="w-1/2 h-2 bg-stone-800 rounded-full"></div>
                  </div>
                  <p className="text-center text-sm font-bold text-gray-400">Tối</p>
                </div>
                <div className="space-y-3 cursor-pointer">
                  <div className="aspect-video bg-emerald-950 rounded-2xl border-2 border-gray-200 flex items-center justify-center">
                    <div className="w-1/2 h-2 bg-emerald-900 rounded-full"></div>
                  </div>
                  <p className="text-center text-sm font-bold text-gray-400">Nexora Green</p>
                </div>
              </div>
            </div>

            {/* Advanced */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Cài đặt nâng cao</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                  <div>
                    <h5 className="font-bold text-emerald-950">Chế độ tối giản</h5>
                    <p className="text-xs text-gray-400 mt-1">Ẩn tất cả các số liệu thống kê (like, comment) để tập trung vào nội dung.</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-700 rounded-full relative cursor-pointer flex-shrink-0">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                  <div>
                    <h5 className="font-bold text-emerald-950">Tự động phát video</h5>
                    <p className="text-xs text-gray-400 mt-1">Video sẽ tự động phát khi bạn cuộn qua.</p>
                  </div>
                  <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer flex-shrink-0">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-gray-100 flex justify-end gap-4">
            <button className="px-8 py-3 rounded-full font-bold text-gray-400 hover:bg-gray-100 transition-all">
              Hủy bỏ
            </button>
            <button className="px-10 py-3 rounded-full bg-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all">
              Lưu thay đổi
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}