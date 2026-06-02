'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Bell, Mail, User, Settings, Sparkles, MoreHorizontal } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CurrentUser {
  id: string
  name: string
  email: string
  avatar?: string
}

export function BottomNav() {
  const pathname = usePathname()
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [showDrawer, setShowDrawer] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const onNotif = (e: Event) => setUnreadNotifs((e as CustomEvent<number>).detail)
    const onMsg = (e: Event) => setUnreadMessages((e as CustomEvent<number>).detail)
    window.addEventListener('nexora:notif-count', onNotif)
    window.addEventListener('nexora:msg-count', onMsg)

    const t = localStorage.getItem('accessToken')
    if (t) {
      fetch('/api/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(d => { if (d?.data) setCurrentUser(d.data) })
        .catch(() => {})
    }

    return () => {
      window.removeEventListener('nexora:notif-count', onNotif)
      window.removeEventListener('nexora:msg-count', onMsg)
    }
  }, [])

  const mainNav = [
    { icon: Home, path: '/home', badge: 0, label: 'Trang chủ' },
    { icon: Compass, path: '/explore', badge: 0, label: 'Khám phá' },
    { icon: Bell, path: '/notifications', badge: unreadNotifs, label: 'Thông báo' },
    { icon: Mail, path: '/messages', badge: unreadMessages, label: 'Tin nhắn' },
    { icon: User, path: '/profile', badge: 0, label: 'Hồ sơ' },
  ]

  const isMoreActive = ['/ai', '/settings'].some(p => pathname.startsWith(p))

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-1 pt-2 pb-5">
          {mainNav.map(({ icon: Icon, path, badge, label }) => {
            const isActive = pathname === path || (path === '/profile' && pathname.startsWith('/profile') && pathname !== '/profile/undefined')
            return (
              <Link
                key={path}
                href={path}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all active:scale-90 min-w-0 ${
                  isActive ? 'text-emerald-700' : 'text-gray-400'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 transition-all ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium truncate max-w-[52px] ${isActive ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-600 rounded-full"
                  />
                )}
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setShowDrawer(true)}
            className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all active:scale-90 ${
              isMoreActive ? 'text-emerald-700' : 'text-gray-400'
            }`}
          >
            <MoreHorizontal className="w-6 h-6 stroke-[1.8px]" />
            <span className="text-[10px] font-medium">Thêm</span>
          </button>
        </div>
      </nav>

      {/* Drawer overlay + panel */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowDrawer(false)}
              className="md:hidden fixed inset-0 bg-black/40 z-50"
            />

            <motion.div
              key="drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* User card */}
              {currentUser && (
                <Link
                  href="/profile"
                  onClick={() => setShowDrawer(false)}
                  className="flex items-center gap-3 mx-4 my-3 p-4 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors"
                >
                  <img
                    src={currentUser.avatar || `https://i.pravatar.cc/40?u=${currentUser.id}`}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-200 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-emerald-900 text-sm truncate">{currentUser.name}</p>
                    <p className="text-xs text-emerald-700/60 truncate">@{currentUser.email?.split('@')[0]}</p>
                  </div>
                  <div className="text-emerald-400">
                    <User className="w-4 h-4" />
                  </div>
                </Link>
              )}

              {/* Menu items */}
              <div className="px-4 pb-2 space-y-1">
                <Link
                  href="/ai"
                  onClick={() => setShowDrawer(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors ${
                    pathname.startsWith('/ai') ? 'bg-violet-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${pathname.startsWith('/ai') ? 'text-violet-700' : 'text-gray-900'}`}>Nexora AI</p>
                    <p className="text-xs text-gray-400">Chat với AI thông minh</p>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setShowDrawer(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors ${
                    pathname.startsWith('/settings') ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Settings className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Cài đặt</p>
                    <p className="text-xs text-gray-400">Quyền riêng tư & tài khoản</p>
                  </div>
                </Link>
              </div>

              {/* Safe area spacer */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
