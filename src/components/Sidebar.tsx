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
}

export function Sidebar() {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCurrentUser(d.data))
      .catch(() => {})
  }, [])

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Mail, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  return (
    <aside className="hidden md:flex flex-col py-10 gap-2 w-72 h-screen fixed left-0 top-0 bg-emerald-50 rounded-r-[3rem] z-40">
      <div className="px-10 mb-10">
        <h1 className="text-2xl font-black text-emerald-900 italic">Nexora</h1>
        <p className="text-[10px] font-medium text-emerald-800/60 uppercase tracking-widest mt-1">Digital Sanctuary</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-4 px-6 py-4 mx-4 transition-all rounded-full active:scale-95",
                isActive
                  ? "bg-emerald-700 text-white font-bold shadow-sm"
                  : "text-emerald-800/70 hover:bg-emerald-100 font-medium"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-8 mt-auto">
        <Link href="/profile" className="block p-4 bg-white/60 rounded-2xl backdrop-blur-sm hover:bg-white/80 transition-all">
          <p className="text-[10px] uppercase tracking-widest text-emerald-900/40 font-bold mb-3">Tài khoản</p>
          <div className="flex items-center gap-3">
            <img
              src={currentUser?.avatar || `https://i.pravatar.cc/40?u=${currentUser?.id ?? 'me'}`}
              alt={currentUser?.name || ''}
              className="w-10 h-10 rounded-full border-2 border-emerald-100 object-cover"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-emerald-900 truncate">{currentUser?.name ?? '...'}</p>
              <p className="text-[10px] text-emerald-800/60 truncate">@{currentUser?.email?.split('@')[0] ?? ''}</p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  )
}
