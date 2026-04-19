'use client'

import { useState, useEffect } from 'react'
import { User, Shield, Bell, Eye, Palette, HelpCircle, LogOut, ChevronRight, Loader2, Camera } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [activeMenu, setActiveMenu] = useState('Giao diện')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const menuItems = [
    { icon: User, label: 'Chỉnh sửa hồ sơ', desc: 'Tên, ảnh đại diện, tiểu sử' },
    { icon: Palette, label: 'Giao diện', desc: 'Chế độ tối, màu sắc chủ đạo' },
    { icon: Shield, label: 'Bảo mật & Mật khẩu', desc: 'Xác thực 2 lớp, đổi mật khẩu' },
    { icon: Eye, label: 'Quyền riêng tư', desc: 'Ai có thể xem bài viết của bạn' },
    { icon: Bell, label: 'Thông báo', desc: 'Đẩy, Email, SMS' },
    { icon: HelpCircle, label: 'Trợ giúp & Hỗ trợ', desc: 'Trung tâm trợ giúp, báo cáo lỗi' },
  ]

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setUser(data.data)
      setName(data.data?.name || '')
      setBio(data.data?.bio || '')
    }
    fetchUser()
  }, [])

 // Thêm state
const [showLogoutModal, setShowLogoutModal] = useState(false)

// Sửa hàm handleLogout
const handleLogout = () => {
  setShowLogoutModal(true)
}

const confirmLogout = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  router.push('/login')
}

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveMsg('')
    const token = localStorage.getItem('accessToken')

    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, bio })
      })

      if (res.ok) {
        setSaveMsg('✅ Lưu thành công!')
        setTimeout(() => setSaveMsg(''), 3000)
      } else {
        setSaveMsg('❌ Lưu thất bại!')
      }
    } catch {
      setSaveMsg('❌ Không thể kết nối server')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 md:p-10 bg-gray-50 min-h-screen">

      {/* Menu */}
      <section className="lg:w-72 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-6">
          <h2 className="text-xl font-bold text-gray-900 px-2 mb-4">Cài đặt</h2>

          <div className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveMenu(item.label)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all group text-left ${
                  activeMenu === item.label
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activeMenu === item.label ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.label}</p>
                  <p className={`text-xs truncate ${activeMenu === item.label ? 'text-white/70' : 'text-gray-400'}`}>
                    {item.desc}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 opacity-40 flex-shrink-0" />
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
             className="flex items-center gap-3 p-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all w-full"
>
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
              <span className="font-semibold text-sm">Đăng xuất</span>
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1">
        <motion.div
          key={activeMenu}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >

          {/* ─── Chỉnh sửa hồ sơ ─── */}
          {activeMenu === 'Chỉnh sửa hồ sơ' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-8">Chỉnh sửa hồ sơ</h3>

              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <img
                    src={user?.avatar || `https://i.pravatar.cc/80?u=${user?.id}`}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-4 border-emerald-100"
                  />
                  <button className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-emerald-700 transition-all">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
                  />
                </div>

                {/* Email (readonly) */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
                </div>

                {/* Bio */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                    Tiểu sử
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={4}
                    maxLength={200}
                    placeholder="Viết gì đó về bản thân..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/200</p>
                </div>

                {saveMsg && (
                  <p className="text-sm font-medium text-center py-2">{saveMsg}</p>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => { setName(user?.name || ''); setBio(user?.bio || '') }}
                    className="px-6 py-2.5 rounded-full font-semibold text-gray-400 hover:bg-gray-100 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-8 py-2.5 rounded-full bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Giao diện ─── */}
          {activeMenu === 'Giao diện' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-8">Giao diện</h3>
              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Chế độ hiển thị</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Sáng', bg: 'bg-white', border: 'border-emerald-700', textColor: 'text-emerald-700' },
                      { label: 'Tối', bg: 'bg-stone-900', border: 'border-gray-200', textColor: 'text-gray-400' },
                      { label: 'Nexora', bg: 'bg-emerald-950', border: 'border-gray-200', textColor: 'text-gray-400' },
                    ].map((theme) => (
                      <div key={theme.label} className="space-y-2 cursor-pointer">
                        <div className={`aspect-video ${theme.bg} rounded-xl border-2 ${theme.border} flex items-center justify-center`}>
                          <div className="w-1/2 h-1.5 bg-gray-200/30 rounded-full"></div>
                        </div>
                        <p className={`text-center text-sm font-bold ${theme.textColor}`}>{theme.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Cài đặt nâng cao</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Chế độ tối giản', desc: 'Ẩn số liệu thống kê', on: true },
                      { label: 'Tự động phát video', desc: 'Video tự phát khi cuộn', on: false },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                          <p className="text-xs text-gray-400">{item.desc}</p>
                        </div>
                        <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${item.on ? 'bg-emerald-700' : 'bg-gray-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.on ? 'right-1' : 'left-1'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Các menu khác ─── */}
          {!['Chỉnh sửa hồ sơ', 'Giao diện'].includes(activeMenu) && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <HelpCircle className="w-8 h-8" />
              </div>
              <p className="font-semibold text-gray-600">{activeMenu}</p>
              <p className="text-sm mt-1">Tính năng đang được phát triển</p>
            </div>
          )}

        </motion.div>
      </section>
      {/* Modal xác nhận đăng xuất */}
{showLogoutModal && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-8 shadow-xl max-w-sm w-full mx-4"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
          <LogOut className="w-8 h-8 text-rose-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Đăng xuất?</h3>
        <p className="text-gray-500 text-sm mb-8">
          Bạn có chắc muốn đăng xuất khỏi Nexora không?
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={confirmLogout}
            className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </motion.div>
  </div>
)}
    </div>
  )
  
}