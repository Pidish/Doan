'use client'

import Link from 'next/link'
import { Bell, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'

export function MobileHeader() {
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    const onNotif = (e: Event) => setUnreadNotifs((e as CustomEvent<number>).detail)
    const onMsg = (e: Event) => setUnreadMessages((e as CustomEvent<number>).detail)
    window.addEventListener('nexora:notif-count', onNotif)
    window.addEventListener('nexora:msg-count', onMsg)
    return () => {
      window.removeEventListener('nexora:notif-count', onNotif)
      window.removeEventListener('nexora:msg-count', onMsg)
    }
  }, [])

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-emerald-50/95 backdrop-blur-sm border-b border-emerald-100 px-5 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-black text-emerald-900 italic leading-none">Nexora</h1>
        <p className="text-[9px] font-semibold text-emerald-700/50 uppercase tracking-widest mt-0.5">Digital Sanctuary</p>
      </div>

      <div className="flex items-center gap-1">
        <Link href="/notifications" className="relative p-2.5 rounded-2xl hover:bg-emerald-100 active:scale-90 transition-all">
          <Bell className="w-5 h-5 text-emerald-800" />
          {unreadNotifs > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {unreadNotifs > 99 ? '99+' : unreadNotifs}
            </span>
          )}
        </Link>
        <Link href="/messages" className="relative p-2.5 rounded-2xl hover:bg-emerald-100 active:scale-90 transition-all">
          <Mail className="w-5 h-5 text-emerald-800" />
          {unreadMessages > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {unreadMessages > 99 ? '99+' : unreadMessages}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
