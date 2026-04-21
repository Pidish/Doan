'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Edit3, Video, Phone, Info, PlusCircle, Image, Smile, Send, Loader2, UserPlus } from 'lucide-react'
import PusherClient, { Channel } from 'pusher-js'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Message {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
  deletedAt?: string | null
}

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [followingUsers, setFollowingUsers] = useState<User[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pusherRef = useRef<PusherClient | null>(null)
  const channelRef = useRef<Channel | null>(null)
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      try {
        const meRes = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        const meData = await meRes.json()
        const me: User = meData.data
        setCurrentUser(me)

        const [usersRes, followingRes] = await Promise.all([
          fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/follow/${me.id}/following`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const [usersData, followingData] = await Promise.all([usersRes.json(), followingRes.json()])

        const allUsers: User[] = (usersData.data || []).filter((u: User) => u.id !== me.id)
        const following: User[] = followingData.data || []
        const followingIdSet = new Set(following.map((f: User) => f.id))
        setFollowingIds(followingIdSet)

        const followed = allUsers.filter(u => followingIdSet.has(u.id))
        const notFollowed = allUsers.filter(u => !followingIdSet.has(u.id))

        setFollowingUsers(followed)
        setSuggestedUsers(notFollowed)
        if (followed.length > 0) setSelectedUser(followed[0])
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    pusherRef.current = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
    )
    return () => { pusherRef.current?.disconnect() }
  }, [])

  // Subscribe Pusher channel when selected user changes
  useEffect(() => {
    if (!currentUser || !selectedUser || !pusherRef.current) return

    channelRef.current?.unbind_all()
    channelRef.current?.unsubscribe()
    setMessages([])

    const channelName = `chat-${[currentUser.id, selectedUser.id].sort().join('-')}`
    channelRef.current = pusherRef.current.subscribe(channelName)

    channelRef.current.bind('new-message', (data: Message) => {
      setMessages(prev => [...prev, data])
    })
    channelRef.current.bind('message-deleted', (data: { id: string; deletedAt: string }) => {
      setMessages(prev => prev.map(m => m.id === data.id ? { ...m, deletedAt: data.deletedAt } : m))
    })

    return () => { channelRef.current?.unbind_all() }
  }, [currentUser, selectedUser])

  // Load chat history
  useEffect(() => {
    if (!currentUser || !selectedUser) return
    const token = localStorage.getItem('accessToken')
    fetch(`/api/messages?receiverId=${selectedUser.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setMessages(d.data || []))
      .catch(() => {})
  }, [currentUser, selectedUser])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFollow = async (targetUser: User) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    setFollowLoadingId(targetUser.id)
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ followingId: targetUser.id })
      })
      const data = await res.json()
      if (res.ok && data.following) {
        setFollowingIds(prev => new Set([...prev, targetUser.id]))
        setFollowingUsers(prev => [...prev, targetUser])
        setSuggestedUsers(prev => prev.filter(u => u.id !== targetUser.id))
        setSelectedUser(targetUser)
      }
    } finally {
      setFollowLoadingId(null)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return
    setSending(true)
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: selectedUser.id, message: newMessage })
      })
      if (res.ok) setNewMessage('')
    } catch (err) {
      console.error('Send error:', err)
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (id: string) => {
    const token = localStorage.getItem('accessToken')
    try {
      await fetch(`/api/messages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, deletedAt: new Date().toISOString() } : m))
      setSelectedMsg(null)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const timeFormat = (date: string) =>
    new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  const filterUser = (u: User) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())

  const filteredFollowing = followingUsers.filter(filterUser)
  const filteredSuggested = suggestedUsers.filter(filterUser)

  const isFollowing = selectedUser ? followingIds.has(selectedUser.id) : false

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Tin nhắn</h2>
            <button className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-all">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">

          {/* Following — can chat */}
          {filteredFollowing.length > 0 && (
            <>
              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Đang theo dõi
              </p>
              {filteredFollowing.map(user => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${selectedUser?.id === user.id ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={user.avatar || `https://i.pravatar.cc/48?u=${user.id}`} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">@{user.email.split('@')[0]}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Suggested — not following */}
          {filteredSuggested.length > 0 && (
            <>
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-1">Gợi ý kết nối</p>
              </div>
              {filteredSuggested.map(user => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative flex-shrink-0">
                    <img src={user.avatar || `https://i.pravatar.cc/48?u=${user.id}`} alt={user.name} className="w-12 h-12 rounded-full object-cover opacity-75" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-700 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">@{user.email.split('@')[0]}</p>
                  </div>
                  <button
                    onClick={() => handleFollow(user)}
                    disabled={followLoadingId === user.id}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {followLoadingId === user.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <><UserPlus className="w-3 h-3" /> Theo dõi</>
                    }
                  </button>
                </div>
              ))}
            </>
          )}

          {filteredFollowing.length === 0 && filteredSuggested.length === 0 && (
            <p className="text-center py-10 text-gray-400 text-sm">Không tìm thấy ai</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col">

          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={selectedUser.avatar || `https://i.pravatar.cc/40?u=${selectedUser.id}`} className="w-10 h-10 rounded-full object-cover" alt={selectedUser.name} />
                {isFollowing && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{selectedUser.name}</p>
                <p className="text-xs text-emerald-500">{isFollowing ? 'Đang hoạt động' : 'Chưa theo dõi'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><Video className="w-5 h-5" /></button>
              <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
              <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><Info className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Not following notice */}
          {!isFollowing && (
            <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
              <p className="text-sm text-amber-700">Theo dõi <span className="font-semibold">{selectedUser.name}</span> để bắt đầu trò chuyện</p>
              <button
                onClick={() => handleFollow(selectedUser)}
                disabled={followLoadingId === selectedUser.id}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 transition-all disabled:opacity-50 ml-3 flex-shrink-0"
              >
                {followLoadingId === selectedUser.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserPlus className="w-3 h-3" /> Theo dõi</>}
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3" onClick={() => setSelectedMsg(null)}>
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <img src={selectedUser.avatar || `https://i.pravatar.cc/64?u=${selectedUser.id}`} className="w-16 h-16 rounded-full object-cover mb-3" alt={selectedUser.name} />
                <p className="font-semibold text-gray-600">{selectedUser.name}</p>
                <p className="text-sm mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === currentUser?.id
                const isSelected = selectedMsg === msg.id
                return (
                  <div key={msg.id} className={`flex gap-2 items-end group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && (
                      <img src={selectedUser.avatar || `https://i.pravatar.cc/32?u=${selectedUser.id}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt={selectedUser.name} />
                    )}
                    <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'}`}>
                        {msg.deletedAt ? (
                          <span className={`italic text-xs ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                            {isMe ? 'Bạn đã xóa tin nhắn' : 'Tin nhắn đã bị xóa'} · {timeFormat(msg.deletedAt)}
                          </span>
                        ) : msg.message}
                      </div>
                      <div className="relative flex-shrink-0">
                        {!msg.deletedAt && (
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedMsg(isSelected ? null : msg.id) }}
                            className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold"
                          >···</button>
                        )}
                        {isSelected && (
                          <div className={`absolute bottom-8 ${isMe ? 'right-0' : 'left-0'} z-20 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-44`}>
                            <button
                              onClick={() => { navigator.clipboard.writeText(msg.message); setSelectedMsg(null) }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            ><span>📋</span> Sao chép</button>
                            {isMe && (
                              <button
                                onClick={() => { handleDeleteMessage(msg.id); setSelectedMsg(null) }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                              ><span>🗑</span> Xóa tin nhắn</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 mb-1">{timeFormat(msg.timestamp)}</span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input — disabled if not following */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className={`flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2 ${!isFollowing ? 'opacity-50 pointer-events-none' : ''}`}>
              <button className="text-gray-400 hover:text-emerald-600 transition-colors"><PlusCircle className="w-5 h-5" /></button>
              <button className="text-gray-400 hover:text-emerald-600 transition-colors"><Image className="w-5 h-5" /></button>
              <input
                type="text"
                placeholder={isFollowing ? 'Nhập tin nhắn...' : 'Theo dõi để nhắn tin...'}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isFollowing}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
              <button className="text-gray-400 hover:text-emerald-600 transition-colors"><Smile className="w-5 h-5" /></button>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending || !isFollowing}
                className="w-9 h-9 flex items-center justify-center bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Send className="w-12 h-12 opacity-20" />
          <p className="font-semibold text-gray-500">Chọn một cuộc trò chuyện</p>
          <p className="text-sm">Theo dõi người dùng để bắt đầu nhắn tin</p>
        </div>
      )}
    </div>
  )
}
