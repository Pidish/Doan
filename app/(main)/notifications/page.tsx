'use client'

import { useState, useEffect } from 'react'
import { Bell, UserPlus, Heart, AtSign, Loader2, Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface Notification {
  id: string
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'WARNING'
  message: string
  isRead: boolean
  createdAt: string
  postId?: string
  sender?: {
    id: string
    name: string
    avatar?: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [unreadCount, setUnreadCount] = useState(0)

  const filters = [
    { key: 'all', icon: Bell, label: 'Tất cả' },
    { key: 'FOLLOW', icon: UserPlus, label: 'Theo dõi' },
    { key: 'LIKE', icon: Heart, label: 'Lượt thích' },
    { key: 'COMMENT', icon: AtSign, label: 'Bình luận' },
  ]

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setNotifications(data.data || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem('accessToken')
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    const token = localStorage.getItem('accessToken')
    await fetch('/api/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'FOLLOW': return <UserPlus className="w-4 h-4" />
      case 'LIKE': return <Heart className="w-4 h-4 fill-current" />
      case 'COMMENT': return <AtSign className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getIconBg = (type: string) => {
    switch (type) {
      case 'FOLLOW': return 'bg-emerald-600 text-white'
      case 'LIKE': return 'bg-rose-500 text-white'
      case 'COMMENT': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    return `${days} ngày trước`
  }

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter)

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 md:p-10 bg-gray-50 min-h-screen">

      {/* Filter Sidebar */}
      <div className="lg:w-72 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">
          <h3 className="font-bold text-gray-900 mb-4">Bộ lọc</h3>
          <nav className="flex flex-col gap-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  activeFilter === f.key
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <f.icon className="w-5 h-5" />
                  {f.label}
                </span>
                {f.key === 'all' && unreadCount > 0 && (
                  <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Mẹo nhỏ</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tùy chỉnh thông báo đẩy trong{' '}
              <a href="/settings" className="text-emerald-600 font-semibold hover:underline">Cài đặt</a>
            </p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              Thông báo
              {unreadCount > 0 && (
                <span className="ml-2 text-sm bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {unreadCount} chưa đọc
                </span>
              )}
            </h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 text-sm text-emerald-600 font-semibold hover:underline"
              >
                <Check className="w-4 h-4" /> Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((notif, i) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                  className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-all hover:bg-gray-50 ${
                    !notif.isRead ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  {/* Avatar + Icon */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={notif.sender?.avatar || `https://i.pravatar.cc/48?u=${notif.sender?.id}`}
                      alt={notif.sender?.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white ${getIconBg(notif.type)}`}>
                      {getIcon(notif.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{notif.sender?.name || 'Ai đó'}</span>
                      {' '}{notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}