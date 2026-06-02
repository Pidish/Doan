'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Compass, Bell, Mail, User, Settings, Heart, MessageCircle, UserPlus, ShieldAlert, X, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

interface CurrentUser {
  id: string
  name: string
  email: string
  avatar?: string
  showOnlineStatus?: boolean
}

interface ToastNotif {
  id: string
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'WARNING'
  message: string
  senderName: string
  avatar?: string
  senderId?: string
}

export function Sidebar() {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [toast, setToast] = useState<ToastNotif | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Flag: if messages page already dispatched correct count, skip calcUnreadMsgs result
    let receivedMsgEvent = false

    // Lắng nghe event từ messages page (instant update)
    const onMsgUpdate = (e: Event) => {
      receivedMsgEvent = true
      setUnreadMessages((e as CustomEvent<number>).detail)
    }
    window.addEventListener('message-unread-update', onMsgUpdate)

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

    // Tính số tin nhắn chưa đọc (chỉ dùng nếu messages page chưa dispatch event)
    const calcUnreadMsgs = async (userId: string) => {
      try {
        const res = await fetch('/api/messages/conversations', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (receivedMsgEvent) return // messages page already set the correct count
        let count = 0
        for (const conv of (data.data || [])) {
          const lastRead = localStorage.getItem(`msgLastRead_${conv.userId}`) || '0'
          if (conv.lastMessageSenderId !== userId && new Date(conv.lastMessageAt) > new Date(lastRead)) count++
        }
        setUnreadMessages(count)
      } catch { }
    }

    // Lấy thông tin user + số thông báo chưa đọc
    Promise.all([
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([meData, notifData]) => {
      if (meData?.data) {
        setCurrentUser(meData.data)
        calcUnreadMsgs(meData.data.id)
      }
      setUnreadCount(notifData?.unreadCount ?? 0)
    }).catch(() => {})

    // Kết nối SSE để nhận thông báo realtime
    const es = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.notifications?.length > 0) {
          setUnreadCount(data.unreadCount)
          const latest = data.notifications[0]
          setToast({
            id: latest.id,
            type: latest.type,
            message: latest.message,
            senderName: latest.sender?.name ?? 'Ai đó',
            avatar: latest.sender?.avatar,
            senderId: latest.sender?.id,
          })
        }
      } catch { }
    }

    return () => {
      es.close()
      window.removeEventListener('message-unread-update', onMsgUpdate)
      window.removeEventListener('notification-read', onNotif)
      window.removeEventListener('privacy-updated', onPrivacy)
    }
  }, [])

  // Tự đóng toast sau 5 giây
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  // Broadcast counts to mobile components
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nexora:notif-count', { detail: unreadCount }))
  }, [unreadCount])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nexora:msg-count', { detail: unreadMessages }))
  }, [unreadMessages])

  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/home', badge: 0 },
    { icon: Compass, label: 'Khám phá', path: '/explore', badge: 0 },
    { icon: Bell, label: 'Thông báo', path: '/notifications', badge: unreadCount },
    { icon: Mail, label: 'Tin nhắn', path: '/messages', badge: unreadMessages },
    { icon: Sparkles, label: 'Nexora AI', path: '/ai', badge: 0 },
    { icon: User, label: 'Hồ sơ', path: '/profile', badge: 0 },
    { icon: Settings, label: 'Cài đặt', path: '/settings', badge: 0 },
  ]

  const toastIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <Heart className="w-4 h-4 fill-current" />
      case 'COMMENT': return <MessageCircle className="w-4 h-4" />
      case 'FOLLOW': return <UserPlus className="w-4 h-4" />
      default: return <ShieldAlert className="w-4 h-4" />
    }
  }

  const toastColor = (type: string) => {
    switch (type) {
      case 'LIKE': return 'bg-rose-500'
      case 'COMMENT': return 'bg-blue-500'
      case 'FOLLOW': return 'bg-emerald-500'
      default: return 'bg-amber-500'
    }
  }

  return (
    <>
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

      {/* Toast thông báo realtime */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9999] w-[calc(100vw-2rem)] md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-start gap-3 p-4">
            {/* Avatar + icon loại */}
            <div className="relative flex-shrink-0">
              <img
                src={toast.avatar || `https://i.pravatar.cc/40?u=${toast.senderId ?? 'notif'}`}
                alt={toast.senderName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${toastColor(toast.type)} text-white rounded-full flex items-center justify-center border-2 border-white`}>
                {toastIcon(toast.type)}
              </div>
            </div>

            {/* Nội dung */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Thông báo mới</p>
              <p className="text-sm text-gray-900 leading-snug">
                <span className="font-semibold">{toast.senderName}</span>
                {' '}{toast.message}
              </p>
            </div>

            {/* Nút đóng */}
            <button
              onClick={() => setToast(null)}
              className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar auto-dismiss */}
          <div key={toast.id} className="h-1 bg-emerald-500 origin-left" style={{ animation: 'shrink 5s linear forwards' }} />
        </div>
      )}
    </>
  )
}
