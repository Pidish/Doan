'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Compass, Bell, Mail, User, Settings } from 'lucide-react'
import { cn } from '../lib/utils'

interface CurrentUser {
  id: string
  name: string
  email: string
  avatar?: string
  showOnlineStatus?: boolean
}

export function Sidebar() {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Parallel fetch: me + notifications
    Promise.all([
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([meData, notifData]) => {
      if (meData?.data) setCurrentUser(meData.data)
      setUnreadCount(notifData?.unreadCount ?? 0)
    }).catch(() => {})

    const onNotif = (e: Event) => setUnreadCount((e as CustomEvent<number>).detail)
    window.addEventListener('notification-read', onNotif)

    const onPrivacy = () => {
      const t = localStorage.getItem('accessToken')
      if (!t) return
      fetch('/api/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(d => { if (d?.data) setCurrentUser(d.data) })
        .catch(() => {})
    }
    window.addEventListener('privacy-updated', onPrivacy)

    return () => {
      window.removeEventListener('notification-read', onNotif)
      window.removeEventListener('privacy-updated', onPrivacy)
    }
  }, [])

  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/home', badge: 0 },
    { icon: Compass, label: 'Khám phá', path: '/explore', badge: 0 },
    { icon: Bell, label: 'Thông báo', path: '/notifications', badge: unreadCount },
    { icon: Mail, label: 'Tin nhắn', path: '/messages', badge: 0 },
    { icon: User, label: 'Hồ sơ', path: '/profile', badge: 0 },
    { icon: Settings, label: 'Cài đặt', path: '/settings', badge: 0 },
  ]

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 bg-emerald-50 rounded-r-[3rem] z-40 overflow-hidden">
      {/* Logo */}
      <div className="px-10 pt-10 pb-6">
        <h1 className="text-2xl font-black text-emerald-900 italic">Nexora</h1>
        <p className="text-[10px] font-medium text-emerald-800/60 uppercase tracking-widest mt-1">Digital Sanctuary</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-4 px-6 py-3.5 transition-all rounded-full active:scale-95",
                isActive
                  ? "bg-emerald-700 text-white font-bold shadow-sm"
                  : "text-emerald-800/70 hover:bg-emerald-100 font-medium"
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Account */}
      <div className="px-4 mt-6">
        <Link href="/profile" className="flex items-center gap-3 p-4 bg-white/70 rounded-2xl hover:bg-white/90 transition-all shadow-sm border border-emerald-100/50 group">
          <img
            src={currentUser?.avatar || `https://i.pravatar.cc/40?u=${currentUser?.id ?? 'me'}`}
            alt={currentUser?.name || ''}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
          />
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-900 truncate group-hover:text-emerald-700 transition-colors">{currentUser?.name ?? '...'}</p>
            <p className="text-[10px] text-emerald-800/50 truncate">@{currentUser?.email?.split('@')[0] ?? ''}</p>
          </div>
          {currentUser?.showOnlineStatus !== false && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mr-1" />
          )}
        </Link>
      </div>
    </aside>
  )
}
