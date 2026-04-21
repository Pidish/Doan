'use client'

import { useState, useEffect } from 'react'
import { User, Shield, Bell, Eye, Palette, HelpCircle, LogOut, ChevronRight, Loader2, Check, Eye as EyeIcon, EyeOff, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfile { id: string; name: string; email: string; avatar?: string; bio?: string }

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors ${on ? 'bg-emerald-600' : 'bg-gray-200'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? 'right-1' : 'left-1'}`} />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>
      <div className="bg-gray-50 rounded-2xl overflow-hidden divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function Row({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [activeMenu, setActiveMenu] = useState('Giao diện')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Giao diện
  const [theme, setTheme] = useState('light')
  const [compactMode, setCompactMode] = useState(false)
  const [autoplay, setAutoplay] = useState(false)

  // Bảo mật
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [twoFactor, setTwoFactor] = useState(false)

  // Quyền riêng tư
  const [privateAccount, setPrivateAccount] = useState(false)
  const [showOnline, setShowOnline] = useState(true)
  const [allowDm, setAllowDm] = useState(true)
  const [allowSearch, setAllowSearch] = useState(true)

  // Thông báo
  const [notifLike, setNotifLike] = useState(true)
  const [notifComment, setNotifComment] = useState(true)
  const [notifFollow, setNotifFollow] = useState(true)
  const [notifEmail, setNotifEmail] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setUser(d.data)).catch(() => {})

    // Load saved prefs
    const s = localStorage.getItem('nexora_settings')
    if (s) {
      try {
        const p = JSON.parse(s)
        if (p.theme) setTheme(p.theme)
        if (p.compactMode !== undefined) setCompactMode(p.compactMode)
        if (p.autoplay !== undefined) setAutoplay(p.autoplay)
        if (p.privateAccount !== undefined) setPrivateAccount(p.privateAccount)
        if (p.showOnline !== undefined) setShowOnline(p.showOnline)
        if (p.allowDm !== undefined) setAllowDm(p.allowDm)
        if (p.allowSearch !== undefined) setAllowSearch(p.allowSearch)
        if (p.notifLike !== undefined) setNotifLike(p.notifLike)
        if (p.notifComment !== undefined) setNotifComment(p.notifComment)
        if (p.notifFollow !== undefined) setNotifFollow(p.notifFollow)
        if (p.notifEmail !== undefined) setNotifEmail(p.notifEmail)
        if (p.twoFactor !== undefined) setTwoFactor(p.twoFactor)
      } catch {}
    }
  }, [])

  const savePrefs = (patch: Record<string, unknown>) => {
    const s = localStorage.getItem('nexora_settings')
    const current = s ? JSON.parse(s) : {}
    localStorage.setItem('nexora_settings', JSON.stringify({ ...current, ...patch }))
  }

  const handleChangePassword = async () => {
    if (!curPw || !newPw || !confirmPw) { setPwMsg({ text: 'Vui lòng điền đầy đủ', ok: false }); return }
    if (newPw !== confirmPw) { setPwMsg({ text: 'Mật khẩu mới không khớp', ok: false }); return }
    if (newPw.length < 6) { setPwMsg({ text: 'Mật khẩu mới phải từ 6 ký tự', ok: false }); return }

    setPwSaving(true)
    setPwMsg(null)
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw })
      })
      const data = await res.json()
      if (res.ok) {
        setPwMsg({ text: 'Đổi mật khẩu thành công!', ok: true })
        setCurPw(''); setNewPw(''); setConfirmPw('')
      } else {
        setPwMsg({ text: data.error || 'Thất bại', ok: false })
      }
    } catch { setPwMsg({ text: 'Lỗi kết nối', ok: false }) }
    finally { setPwSaving(false) }
  }

  const confirmLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/login')
  }

  const menuItems = [
    { icon: User, label: 'Chỉnh sửa hồ sơ', desc: 'Tên, ảnh đại diện, tiểu sử' },
    { icon: Palette, label: 'Giao diện', desc: 'Chế độ tối, màu sắc chủ đạo' },
    { icon: Shield, label: 'Bảo mật & Mật khẩu', desc: 'Xác thực 2 lớp, đổi mật khẩu' },
    { icon: Eye, label: 'Quyền riêng tư', desc: 'Ai có thể xem bài viết của bạn' },
    { icon: Bell, label: 'Thông báo', desc: 'Đẩy, Email, SMS' },
    { icon: HelpCircle, label: 'Trợ giúp & Hỗ trợ', desc: 'Trung tâm trợ giúp, báo cáo lỗi' },
  ]

  const themes = [
    { key: 'light', label: 'Sáng', bg: 'bg-white', bar: 'bg-gray-200' },
    { key: 'dark', label: 'Tối', bg: 'bg-stone-900', bar: 'bg-stone-600' },
    { key: 'nexora', label: 'Nexora', bg: 'bg-emerald-950', bar: 'bg-emerald-700' },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 md:p-10 bg-gray-50 min-h-screen">

      {/* Sidebar menu */}
      <section className="lg:w-72 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-6">
          <h2 className="text-xl font-bold text-gray-900 px-2 mb-4">Cài đặt</h2>
          <div className="flex flex-col gap-1">
            {menuItems.map(item => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.label === 'Chỉnh sửa hồ sơ') { router.push('/profile/edit'); return }
                  setActiveMenu(item.label)
                }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  activeMenu === item.label ? 'bg-emerald-700 text-white shadow-sm' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activeMenu === item.label ? 'bg-white/20' : 'bg-gray-100'}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.label}</p>
                  <p className={`text-xs truncate ${activeMenu === item.label ? 'text-white/70' : 'text-gray-400'}`}>{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 opacity-40 flex-shrink-0" />
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowLogoutModal(true)}
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
      <section className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8"
          >

            {/* ── Giao diện ── */}
            {activeMenu === 'Giao diện' && (
              <>
                <h3 className="text-xl font-bold text-gray-900">Giao diện</h3>
                <Section title="Chế độ hiển thị">
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      {themes.map(t => (
                        <button
                          key={t.key}
                          onClick={() => {
                            setTheme(t.key)
                            savePrefs({ theme: t.key })
                            window.dispatchEvent(new CustomEvent('nexora-theme', { detail: t.key }))
                          }}
                          className="space-y-2 group"
                        >
                          <div className={`aspect-video ${t.bg} rounded-xl border-2 transition-all flex flex-col justify-center items-center gap-1 ${theme === t.key ? 'border-emerald-600 shadow-md' : 'border-gray-200'}`}>
                            <div className={`w-8 h-1.5 ${t.bar} rounded-full`} />
                            <div className={`w-5 h-1 ${t.bar} rounded-full opacity-60`} />
                          </div>
                          <p className={`text-center text-sm font-bold ${theme === t.key ? 'text-emerald-700' : 'text-gray-400'}`}>
                            {t.label} {theme === t.key && <Check className="inline w-3.5 h-3.5 mb-0.5" />}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>
                <Section title="Cài đặt nâng cao">
                  <Row label="Chế độ tối giản" desc="Ẩn số liệu thống kê trên bài viết"
                    right={<Toggle on={compactMode} onChange={v => { setCompactMode(v); savePrefs({ compactMode: v }) }} />} />
                  <Row label="Tự động phát video" desc="Video tự phát khi cuộn qua"
                    right={<Toggle on={autoplay} onChange={v => { setAutoplay(v); savePrefs({ autoplay: v }) }} />} />
                </Section>
              </>
            )}

            {/* ── Bảo mật ── */}
            {activeMenu === 'Bảo mật & Mật khẩu' && (
              <>
                <h3 className="text-xl font-bold text-gray-900">Bảo mật & Mật khẩu</h3>

                <Section title="Đổi mật khẩu">
                  <div className="p-4 space-y-4">
                    {[
                      { label: 'Mật khẩu hiện tại', value: curPw, onChange: setCurPw, show: showCur, toggle: setShowCur },
                      { label: 'Mật khẩu mới', value: newPw, onChange: setNewPw, show: showNew, toggle: setShowNew },
                      { label: 'Xác nhận mật khẩu mới', value: confirmPw, onChange: setConfirmPw, show: showNew, toggle: setShowNew },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">{f.label}</label>
                        <div className="relative">
                          <input
                            type={f.show ? 'text' : 'password'}
                            value={f.value}
                            onChange={e => f.onChange(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                            placeholder="••••••••"
                          />
                          <button onClick={() => f.toggle(!f.show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {f.show ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}

                    {pwMsg && (
                      <p className={`text-sm font-medium ${pwMsg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {pwMsg.ok ? '✓ ' : '✗ '}{pwMsg.text}
                      </p>
                    )}

                    <button
                      onClick={handleChangePassword}
                      disabled={pwSaving}
                      className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {pwSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </Section>

                <Section title="Xác thực 2 lớp">
                  <Row label="Xác thực 2 lớp (2FA)" desc="Thêm lớp bảo vệ khi đăng nhập"
                    right={<Toggle on={twoFactor} onChange={v => { setTwoFactor(v); savePrefs({ twoFactor: v }) }} />} />
                </Section>
              </>
            )}

            {/* ── Quyền riêng tư ── */}
            {activeMenu === 'Quyền riêng tư' && (
              <>
                <h3 className="text-xl font-bold text-gray-900">Quyền riêng tư</h3>
                <Section title="Tài khoản">
                  <Row label="Tài khoản riêng tư" desc="Chỉ người theo dõi mới thấy bài viết"
                    right={<Toggle on={privateAccount} onChange={v => { setPrivateAccount(v); savePrefs({ privateAccount: v }) }} />} />
                  <Row label="Hiển thị trạng thái online" desc="Người khác thấy bạn đang hoạt động"
                    right={<Toggle on={showOnline} onChange={v => { setShowOnline(v); savePrefs({ showOnline: v }) }} />} />
                </Section>
                <Section title="Tương tác">
                  <Row label="Cho phép nhắn tin" desc="Ai có thể gửi tin nhắn trực tiếp"
                    right={<Toggle on={allowDm} onChange={v => { setAllowDm(v); savePrefs({ allowDm: v }) }} />} />
                  <Row label="Xuất hiện trong tìm kiếm" desc="Người khác có thể tìm thấy bạn"
                    right={<Toggle on={allowSearch} onChange={v => { setAllowSearch(v); savePrefs({ allowSearch: v }) }} />} />
                </Section>
              </>
            )}

            {/* ── Thông báo ── */}
            {activeMenu === 'Thông báo' && (
              <>
                <h3 className="text-xl font-bold text-gray-900">Thông báo</h3>
                <Section title="Hoạt động">
                  <Row label="Lượt thích" desc="Khi ai đó thích bài viết của bạn"
                    right={<Toggle on={notifLike} onChange={v => { setNotifLike(v); savePrefs({ notifLike: v }) }} />} />
                  <Row label="Bình luận" desc="Khi ai đó bình luận bài viết của bạn"
                    right={<Toggle on={notifComment} onChange={v => { setNotifComment(v); savePrefs({ notifComment: v }) }} />} />
                  <Row label="Theo dõi mới" desc="Khi có người theo dõi bạn"
                    right={<Toggle on={notifFollow} onChange={v => { setNotifFollow(v); savePrefs({ notifFollow: v }) }} />} />
                </Section>
                <Section title="Kênh nhận thông báo">
                  <Row label="Thông báo qua Email" desc={user?.email || ''}
                    right={<Toggle on={notifEmail} onChange={v => { setNotifEmail(v); savePrefs({ notifEmail: v }) }} />} />
                </Section>
              </>
            )}

            {/* ── Trợ giúp ── */}
            {activeMenu === 'Trợ giúp & Hỗ trợ' && (
              <>
                <h3 className="text-xl font-bold text-gray-900">Trợ giúp & Hỗ trợ</h3>
                <Section title="Liên hệ">
                  {[
                    { label: 'Trung tâm trợ giúp', desc: 'Hướng dẫn sử dụng và câu hỏi thường gặp' },
                    { label: 'Báo cáo sự cố', desc: 'Gửi lỗi hoặc phản hồi cho đội ngũ phát triển' },
                    { label: 'Điều khoản sử dụng', desc: 'Xem điều khoản và chính sách của Nexora' },
                    { label: 'Chính sách bảo mật', desc: 'Cách chúng tôi bảo vệ dữ liệu của bạn' },
                  ].map(item => (
                    <Row key={item.label} label={item.label} desc={item.desc}
                      right={<ExternalLink className="w-4 h-4 text-gray-300" />} />
                  ))}
                </Section>
                <Section title="Thông tin ứng dụng">
                  <Row label="Phiên bản" right={<span className="text-sm text-gray-400 font-mono">1.0.0</span>} />
                  <Row label="Môi trường" right={<span className="text-sm text-gray-400 font-mono">Production</span>} />
                </Section>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </section>

      {/* Logout modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 shadow-xl max-w-sm w-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <LogOut className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Đăng xuất?</h3>
              <p className="text-gray-500 text-sm mb-8">Bạn có chắc muốn đăng xuất khỏi Nexora không?</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                  Hủy bỏ
                </button>
                <button onClick={confirmLogout}
                  className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all">
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
