'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Edit3, Video, Phone, Info, PlusCircle, Image, Smile, Send, Loader2,
  UserPlus, ImageIcon, PhoneOff, PhoneMissed, Mic, MicOff,
  VideoIcon, VideoOff, Volume2, VolumeX
} from 'lucide-react'
import PusherClient, { Channel } from 'pusher-js'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  allowMessages?: boolean
  showOnlineStatus?: boolean
}

interface Message {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
  deletedAt?: string | null
}

type CallState = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'
type CallType = 'audio' | 'video'

interface IncomingCallInfo {
  fromUserId: string
  fromUserName: string
  fromUserAvatar?: string
  callType: CallType
  offer: RTCSessionDescriptionInit
}

const EMOJIS = [
  '😀','😂','🤣','😍','🥰','😎','🤔','😢','😡','🥳',
  '🤩','😴','😅','😊','🤗','😇','🥺','😱','😤','💪',
  '👍','👎','❤️','🔥','💯','✨','🎉','🙏','👋','🤝',
  '💀','😈','🤡','👻','💕','💔','🙈','🐶','🌹','⭐',
  '🎵','🍕','🍜','☕','🚀','💡','🎯','🌈','😜','🫡',
]

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
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
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Conversation map: userId → { lastMessage, lastMessageAt, lastMessageSenderId }
  interface ConvInfo { lastMessage: string; lastMessageAt: string; lastMessageSenderId: string }
  const [conversationMap, setConversationMap] = useState<Map<string, ConvInfo>>(new Map())
  const [unreadSet, setUnreadSet] = useState<Set<string>>(new Set())

  // --- Call state ---
  const [callState, setCallState] = useState<CallState>('idle')
  const [callType, setCallType] = useState<CallType>('audio')
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isSpeakerOff, setIsSpeakerOff] = useState(false)
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null)
  const callDurationRef = useRef(0)
  const callTypeRef = useRef<CallType>('audio')
  const selectedUserRef = useRef<User | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pusherRef = useRef<PusherClient | null>(null)
  const channelRef = useRef<Channel | null>(null)
  const callChannelRef = useRef<Channel | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const plusMenuRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const allUsersRef = useRef<User[]>([])
  // Refs to always have fresh state inside async callbacks / Pusher handlers
  const callStateRef = useRef<CallState>('idle')
  const incomingCallRef = useRef<IncomingCallInfo | null>(null)
  const handleCallSignalRef = useRef<((p: { type: string; fromUserId: string; data: Record<string, unknown> }) => void) | null>(null)
  // Buffer ICE candidates that arrive before remote description is set
  const iceCandidateBuffer = useRef<RTCIceCandidateInit[]>([])

  // Fetch initial data
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
        allUsersRef.current = allUsers
        const following: User[] = followingData.data || []
        const followingIdSet = new Set(following.map((f: User) => f.id))
        setFollowingIds(followingIdSet)

        const followed = allUsers.filter(u => followingIdSet.has(u.id))
        const notFollowed = allUsers.filter(u => !followingIdSet.has(u.id))
        setSuggestedUsers(notFollowed)

        // Lấy danh sách conversations để sort theo tin nhắn mới nhất
        const convsRes = await fetch('/api/messages/conversations', { headers: { Authorization: `Bearer ${token}` } })
        const convsData = await convsRes.json()
        const newConvMap = new Map<string, ConvInfo>()
        const newUnread = new Set<string>()

        for (const c of (convsData.data || [])) {
          newConvMap.set(c.userId, { lastMessage: c.lastMessage, lastMessageAt: c.lastMessageAt, lastMessageSenderId: c.lastMessageSenderId })
          const lastRead = localStorage.getItem(`msgLastRead_${c.userId}`) || '0'
          if (c.lastMessageSenderId !== me.id && new Date(c.lastMessageAt) > new Date(lastRead)) {
            newUnread.add(c.userId)
          }
        }
        setConversationMap(newConvMap)

        // Sort following: có tin nhắn → xếp theo thời gian mới nhất, không có → cuối danh sách
        const sortedFollowed = [...followed].sort((a, b) => {
          const aTime = newConvMap.get(a.id)?.lastMessageAt ?? ''
          const bTime = newConvMap.get(b.id)?.lastMessageAt ?? ''
          if (!aTime && !bTime) return 0
          if (!aTime) return 1
          if (!bTime) return -1
          return bTime.localeCompare(aTime)
        })
        setFollowingUsers(sortedFollowed)
        if (sortedFollowed.length > 0) {
          const firstUser = sortedFollowed[0]
          setSelectedUser(firstUser)
          // Auto-selected conversation counts as read immediately
          localStorage.setItem(`msgLastRead_${firstUser.id}`, new Date().toISOString())
          newUnread.delete(firstUser.id)
        }
        setUnreadSet(newUnread)
        window.dispatchEvent(new CustomEvent('message-unread-update', { detail: newUnread.size }))

        // Pick up pending call forwarded by GlobalCallReceiver (user answered from another page)
        const pendingRaw = sessionStorage.getItem('nexora_pending_call')
        if (pendingRaw) {
          sessionStorage.removeItem('nexora_pending_call')
          try {
            const pending = JSON.parse(pendingRaw)
            setIncomingCall(pending)
            setCallState('incoming')
          } catch {}
        }
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
    return () => {
      pusherRef.current?.disconnect()
      stopLocalStream()
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Subscribe to own call channel when currentUser is available
  useEffect(() => {
    if (!currentUser || !pusherRef.current) return
    callChannelRef.current?.unbind_all()
    callChannelRef.current?.unsubscribe()

    const myCallChannel = pusherRef.current.subscribe(`call-${currentUser.id}`)
    callChannelRef.current = myCallChannel

    myCallChannel.bind('call-signal', (payload: { type: string; fromUserId: string; data: Record<string, unknown> }) => {
      handleCallSignalRef.current?.(payload)
    })

    return () => {
      myCallChannel.unbind_all()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  // Chat channel
  useEffect(() => {
    if (!currentUser || !selectedUser || !pusherRef.current) return
    channelRef.current?.unbind_all()
    channelRef.current?.unsubscribe()
    setMessages([])

    const channelName = `chat-${[currentUser.id, selectedUser.id].sort().join('-')}`
    channelRef.current = pusherRef.current.subscribe(channelName)
    channelRef.current.bind('new-message', (data: Message) => {
      setMessages(prev => [...prev, data])
      // Cập nhật conversation map + kéo lên đầu danh sách
      const otherId = data.senderId === currentUser.id ? selectedUser.id : data.senderId
      setConversationMap(prev => {
        const next = new Map(prev)
        next.set(otherId, { lastMessage: data.message, lastMessageAt: data.timestamp, lastMessageSenderId: data.senderId })
        return next
      })
      setFollowingUsers(prev => {
        const idx = prev.findIndex(u => u.id === otherId)
        if (idx <= 0) return prev
        const next = [...prev]
        const [moved] = next.splice(idx, 1)
        return [moved, ...next]
      })
    })
    channelRef.current.bind('message-deleted', (data: { id: string; deletedAt: string }) => {
      setMessages(prev => prev.map(m => m.id === data.id ? { ...m, deletedAt: data.deletedAt } : m))
    })
    return () => { channelRef.current?.unbind_all() }
  }, [currentUser, selectedUser])

  // Load messages
  useEffect(() => {
    if (!currentUser || !selectedUser) return
    const token = localStorage.getItem('accessToken')
    fetch(`/api/messages?receiverId=${selectedUser.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setMessages(d.data || []))
      .catch(() => {})
  }, [currentUser, selectedUser])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setShowEmojiPicker(false)
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) setShowPlusMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sync selectedUser to ref
  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  // Keep call-related state refs fresh for use inside async/Pusher callbacks
  useEffect(() => { callStateRef.current = callState }, [callState])
  useEffect(() => { incomingCallRef.current = incomingCall }, [incomingCall])

  // Re-apply local stream to overlay video element when call becomes connected
  useEffect(() => {
    if (callState === 'connected' && callType === 'video' && localStreamRef.current) {
      const t = setTimeout(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
      }, 50)
      return () => clearTimeout(t)
    }
  }, [callState, callType])

  // Personal channel: nhận tin nhắn từ mọi conversation (kể cả không đang xem)
  useEffect(() => {
    if (!currentUser || !pusherRef.current) return
    const personalCh = pusherRef.current.subscribe(`user-${currentUser.id}`)
    personalCh.bind('new-direct-message', (data: { senderId: string; lastMessage: string; timestamp: string }) => {
      // Cập nhật conversation map
      setConversationMap(prev => {
        const next = new Map(prev)
        next.set(data.senderId, { lastMessage: data.lastMessage, lastMessageAt: data.timestamp, lastMessageSenderId: data.senderId })
        return next
      })
      // Kéo người gửi lên đầu danh sách
      setFollowingUsers(prev => {
        const idx = prev.findIndex(u => u.id === data.senderId)
        if (idx <= 0) return prev
        const next = [...prev]
        const [moved] = next.splice(idx, 1)
        return [moved, ...next]
      })
      // Nếu không đang xem conversation này → thêm vào unread
      if (data.senderId !== selectedUserRef.current?.id) {
        setUnreadSet(prev => {
          const next = new Set(prev)
          next.add(data.senderId)
          window.dispatchEvent(new CustomEvent('message-unread-update', { detail: next.size }))
          return next
        })
      }
    })
    return () => {
      personalCh.unbind_all()
      pusherRef.current?.unsubscribe(`user-${currentUser.id}`)
    }
  }, [currentUser])

  // Sync callType to ref
  useEffect(() => {
    callTypeRef.current = callType
  }, [callType])

  // Call timer
  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(d => {
          callDurationRef.current = d + 1
          return d + 1
        })
      }, 1000)
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
      if (callState === 'idle') {
        callDurationRef.current = 0
        setCallDuration(0)
      }
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current) }
  }, [callState])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const stopLocalStream = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
  }

  const closePeerConnection = () => {
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
  }

  const sendSignal = async (type: string, targetUserId: string, data?: Record<string, unknown>) => {
    const token = localStorage.getItem('accessToken')
    await fetch('/api/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, targetUserId, data }),
    })
  }

  // Gửi tin nhắn hệ thống vào cuộc trò chuyện
  const sendCallSystemMessage = async (receiverId: string, content: string) => {
    const token = localStorage.getItem('accessToken')
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId, message: content }),
      })
    } catch {}
  }

  const createPeerConnection = useCallback((targetUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionRef.current = pc

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice-candidate', targetUserId, { candidate: event.candidate.toJSON() })
      }
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected')
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        endCall()
      }
    }

    return pc
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startCall = async (type: CallType) => {
    if (!selectedUser || !currentUser) return
    setCallType(type)
    setCallState('calling')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const pc = createPeerConnection(selectedUser.id)
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      await sendSignal('call-offer', selectedUser.id, {
        callType: type,
        offer: { type: offer.type, sdp: offer.sdp },
        fromUserName: currentUser.name,
        fromUserAvatar: currentUser.avatar,
      })
    } catch (err) {
      console.error('Start call error:', err)
      setCallState('idle')
      alert('Không thể truy cập microphone/camera. Vui lòng kiểm tra quyền truy cập.')
    }
  }

  const handleCallSignal = async (payload: { type: string; fromUserId: string; data: Record<string, unknown> }) => {
    const { type, fromUserId, data } = payload

    if (type === 'call-offer') {
      const allUsers = allUsersRef.current
      const caller = allUsers.find(u => u.id === fromUserId)
      setIncomingCall({
        fromUserId,
        fromUserName: (data.fromUserName as string) || caller?.name || 'Người dùng',
        fromUserAvatar: (data.fromUserAvatar as string) || caller?.avatar,
        callType: (data.callType as CallType) || 'audio',
        offer: data.offer as RTCSessionDescriptionInit,
      })
      setCallState('incoming')
    }

    if (type === 'call-answer' && peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.answer as RTCSessionDescriptionInit)
      )
      // Drain buffered ICE candidates that arrived before remote description was set
      for (const c of iceCandidateBuffer.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
      }
      iceCandidateBuffer.current = []
      setCallState('connected')
      // Re-apply local stream after the video overlay mounts (caller side)
      setTimeout(() => {
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current
        }
      }, 50)
    }

    if (type === 'ice-candidate') {
      const pc = peerConnectionRef.current
      if (pc && pc.remoteDescription) {
        // Remote description already set — add immediately
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate as RTCIceCandidateInit)).catch(() => {})
      } else {
        // Peer connection not ready yet — buffer until after setRemoteDescription
        iceCandidateBuffer.current.push(data.candidate as RTCIceCandidateInit)
      }
    }

    if (type === 'call-end') {
      endCall(true)
    }

    if (type === 'call-reject') {
      // Người kia từ chối → cuộc gọi nhỡ phía người gọi
      closePeerConnection()
      stopLocalStream()
      setCallState('idle')
      const target = selectedUserRef.current
      if (target) {
        const cType = callTypeRef.current
        await sendCallSystemMessage(target.id, `__call_missed__:${cType}`)
      }
    }
  }
  // Always keep the ref pointing to the latest version (fixes stale closure in Pusher binding)
  handleCallSignalRef.current = handleCallSignal

  const acceptCall = async () => {
    if (!incomingCall || !currentUser) return
    const callTypeToUse = incomingCall.callType
    setCallType(callTypeToUse)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callTypeToUse === 'video',
      })
      localStreamRef.current = stream

      const pc = createPeerConnection(incomingCall.fromUserId)
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
      // Drain ICE candidates buffered while waiting for user to accept
      for (const c of iceCandidateBuffer.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
      }
      iceCandidateBuffer.current = []
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      await sendSignal('call-answer', incomingCall.fromUserId, {
        answer: { type: answer.type, sdp: answer.sdp },
      })
      setIncomingCall(null)
      setCallState('connected')
      // Apply local stream after overlay video element mounts
      setTimeout(() => {
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current
        }
      }, 50)
    } catch (err) {
      console.error('Accept call error:', err)
      endCall()
    }
  }

  const rejectCall = async () => {
    if (!incomingCall) return
    await sendSignal('call-reject', incomingCall.fromUserId, {})
    // Gửi tin nhắn cuộc gọi nhỡ vào chat của người nhận
    const cType = incomingCall.callType
    const callerId = incomingCall.fromUserId
    setIncomingCall(null)
    setCallState('idle')
    await sendCallSystemMessage(callerId, `__call_missed__:${cType}`)
  }

  const endCall = async (fromRemote = false) => {
    iceCandidateBuffer.current = []
    const wasConnected = callStateRef.current === 'connected'
    const duration = callDurationRef.current
    const cType = callTypeRef.current
    const target = selectedUserRef.current
    const incoming = incomingCallRef.current

    // Only the side that initiated end sends the call-end signal to avoid loops
    if (!fromRemote) {
      if (callStateRef.current !== 'idle' && target) {
        await sendSignal('call-end', target.id, {}).catch(() => {})
      }
      if (incoming) {
        await sendSignal('call-end', incoming.fromUserId, {}).catch(() => {})
      }
    }
    closePeerConnection()
    stopLocalStream()
    setIncomingCall(null)
    setCallState('idle')
    setIsMuted(false)
    setIsCameraOff(false)
    setIsSpeakerOff(false)

    // Only the initiating side sends the system message to avoid duplicates
    if (!fromRemote) {
      const receiverId = target?.id || incoming?.fromUserId
      if (receiverId) {
        if (wasConnected && duration > 0) {
          const mins = Math.floor(duration / 60).toString().padStart(2, '0')
          const secs = (duration % 60).toString().padStart(2, '0')
          await sendCallSystemMessage(receiverId, `__call_ended__:${cType}:${mins}:${secs}`)
        } else if (!wasConnected) {
          await sendCallSystemMessage(receiverId, `__call_missed__:${cType}`)
        }
      }
    }
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted })
      setIsMuted(v => !v)
    }
  }

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = isCameraOff })
      setIsCameraOff(v => !v)
    }
  }

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeakerOff
      setIsSpeakerOff(v => !v)
    }
  }

  const handleFollow = async (targetUser: User) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    setFollowLoadingId(targetUser.id)
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ followingId: targetUser.id }),
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

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    localStorage.setItem(`msgLastRead_${user.id}`, new Date().toISOString())
    setUnreadSet(prev => {
      if (!prev.has(user.id)) return prev
      const next = new Set(prev)
      next.delete(user.id)
      window.dispatchEvent(new CustomEvent('message-unread-update', { detail: next.size }))
      return next
    })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return
    setSending(true)
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: selectedUser.id, message: newMessage }),
      })
      if (res.ok) setNewMessage('')
    } catch (err) {
      console.error('Send error:', err)
    } finally {
      setSending(false)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedUser || !currentUser) return
    e.target.value = ''
    setUploadingImage(true)
    setShowPlusMenu(false)
    const token = localStorage.getItem('accessToken')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) { alert(uploadData.error || 'Upload thất bại'); return }
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: selectedUser.id, message: `__img__:${uploadData.url}` }),
      })
    } catch {
      alert('Lỗi khi gửi ảnh')
    } finally {
      setUploadingImage(false)
    }
  }

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
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
  const selectedAllowsMessages = selectedUser ? (selectedUser.allowMessages !== false) : true
  const canChat = isFollowing && selectedAllowsMessages

  const isImageMessage = (msg: string) => msg.startsWith('__img__:')
  const getImageUrl = (msg: string) => msg.replace('__img__:', '')

  const isCallEndedMessage = (msg: string) => msg.startsWith('__call_ended__:')
  const isCallMissedMessage = (msg: string) => msg.startsWith('__call_missed__:')

  const parseCallEnded = (msg: string) => {
    // format: __call_ended__:audio:MM:SS
    const parts = msg.replace('__call_ended__:', '').split(':')
    const type = parts[0] as CallType
    const duration = `${parts[1]}:${parts[2]}`
    return { type, duration }
  }

  const parseCallMissed = (msg: string) => {
    const type = msg.replace('__call_missed__:', '') as CallType
    return { type }
  }

  const callTarget = incomingCall
    ? { name: incomingCall.fromUserName, avatar: incomingCall.fromUserAvatar }
    : selectedUser
      ? { name: selectedUser.name, avatar: selectedUser.avatar }
      : { name: '', avatar: undefined }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Hidden video elements */}
      <video ref={localVideoRef} autoPlay muted playsInline className="hidden" />
      <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />

      {/* ─── INCOMING CALL OVERLAY ─── */}
      <AnimatePresence>
        {callState === 'incoming' && incomingCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-80 rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              }}
            >
              {/* Animated rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border border-emerald-400/20"
                    style={{ width: 100 + i * 60, height: 100 + i * 60 }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.05, 0.3] }}
                    transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
                  />
                ))}
              </div>

              <div className="relative z-10 flex flex-col items-center px-8 py-10 gap-6">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={incomingCall.fromUserAvatar || `https://i.pravatar.cc/80?u=${incomingCall.fromUserId}`}
                    alt={incomingCall.fromUserName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-xl"
                  />
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: incomingCall.callType === 'video' ? '#8b5cf6' : '#10b981' }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {incomingCall.callType === 'video'
                      ? <VideoIcon className="w-4 h-4 text-white" />
                      : <Phone className="w-4 h-4 text-white" />
                    }
                  </motion.div>
                </div>

                <div className="text-center">
                  <p className="text-white/60 text-sm font-medium tracking-wide uppercase">
                    {incomingCall.callType === 'video' ? 'Cuộc gọi video' : 'Cuộc gọi thoại'} đến
                  </p>
                  <h3 className="text-white text-2xl font-bold mt-1">{incomingCall.fromUserName}</h3>
                  <motion.p
                    className="text-emerald-400 text-sm mt-1"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Đang gọi cho bạn...
                  </motion.p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-8 mt-2">
                  <div className="flex flex-col items-center gap-2">
                    <motion.button
                      onClick={rejectCall}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40"
                    >
                      <PhoneOff className="w-7 h-7 text-white" />
                    </motion.button>
                    <span className="text-white/60 text-xs">Từ chối</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <motion.button
                      onClick={acceptCall}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      <Phone className="w-7 h-7 text-white" />
                    </motion.button>
                    <span className="text-white/60 text-xs">Chấp nhận</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ACTIVE CALL OVERLAY ─── */}
      <AnimatePresence>
        {(callState === 'calling' || callState === 'connected') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="relative w-96 rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, #0d1117 0%, #161b22 60%, #1c2330 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Video area (if video call) */}
              {callType === 'video' && callState === 'connected' && (
                <div className="relative w-full h-56 bg-gray-900 overflow-hidden">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 w-20 h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center px-8 py-8 gap-5">
                {/* Avatar (audio or calling state) */}
                {(callType === 'audio' || callState === 'calling') && (
                  <div className="relative">
                    <div className="relative">
                      {/* Pulse rings */}
                      {callState === 'connected' && [1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full bg-emerald-500/20"
                          style={{ inset: -(i * 14), borderRadius: '50%' }}
                          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                        />
                      ))}
                      <img
                        src={callTarget.avatar || `https://i.pravatar.cc/80?u=${selectedUser?.id}`}
                        alt={callTarget.name}
                        className="relative w-24 h-24 rounded-full object-cover border-4 border-white/10 shadow-xl z-10"
                      />
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-white text-2xl font-bold">{callTarget.name}</h3>
                  {callState === 'calling' ? (
                    <motion.p
                      className="text-gray-400 text-sm mt-1"
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Đang gọi...
                    </motion.p>
                  ) : (
                    <p className="text-emerald-400 text-sm mt-1 font-mono font-medium">
                      {formatDuration(callDuration)}
                    </p>
                  )}
                </div>

                {/* Controls */}
                {callState === 'connected' && (
                  <div className="flex items-center gap-4 mt-2">
                    {/* Mute */}
                    <div className="flex flex-col items-center gap-1.5">
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={toggleMute}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </motion.button>
                      <span className="text-white/50 text-[10px]">{isMuted ? 'Bật mic' : 'Tắt mic'}</span>
                    </div>

                    {/* Speaker */}
                    <div className="flex flex-col items-center gap-1.5">
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={toggleSpeaker}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSpeakerOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                      >
                        {isSpeakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </motion.button>
                      <span className="text-white/50 text-[10px]">{isSpeakerOff ? 'Bật loa' : 'Tắt loa'}</span>
                    </div>

                    {/* Camera (video only) */}
                    {callType === 'video' && (
                      <div className="flex flex-col items-center gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                          onClick={toggleCamera}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
                        </motion.button>
                        <span className="text-white/50 text-[10px]">{isCameraOff ? 'Bật cam' : 'Tắt cam'}</span>
                      </div>
                    )}

                    {/* End call */}
                    <div className="flex flex-col items-center gap-1.5">
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => endCall()}
                        className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
                      >
                        <PhoneOff className="w-5 h-5 text-white" />
                      </motion.button>
                      <span className="text-white/50 text-[10px]">Kết thúc</span>
                    </div>
                  </div>
                )}

                {/* Calling state — only end button */}
                {callState === 'calling' && (
                  <motion.button
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    onClick={() => endCall()}
                    className="mt-2 w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40"
                  >
                    <PhoneOff className="w-7 h-7 text-white" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SIDEBAR ─── */}
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
          {filteredFollowing.length > 0 && (
            <>
              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đang theo dõi</p>
              {filteredFollowing.map(user => {
                const conv = conversationMap.get(user.id)
                const hasUnread = unreadSet.has(user.id)
                const isSelected = selectedUser?.id === user.id
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="relative flex-shrink-0">
                      <img src={user.avatar || `https://i.pravatar.cc/48?u=${user.id}`} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                      {user.showOnlineStatus !== false && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>{user.name}</p>
                        {conv && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        {conv ? (
                          <p className={`text-xs truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                            {conv.lastMessageSenderId === currentUser?.id ? 'Bạn: ' : ''}
                            {conv.lastMessage.startsWith('__img__:') ? '📷 Hình ảnh' :
                             conv.lastMessage.startsWith('__call_ended__:') ? '📞 Cuộc gọi kết thúc' :
                             conv.lastMessage.startsWith('__call_missed__:') ? '📞 Cuộc gọi nhỡ' :
                             conv.lastMessage.slice(0, 30) + (conv.lastMessage.length > 30 ? '…' : '')}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 truncate">@{user.email.split('@')[0]}</p>
                        )}
                        {hasUnread && (
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

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

      {/* ─── CHAT AREA ─── */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col">

          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={selectedUser.avatar || `https://i.pravatar.cc/40?u=${selectedUser.id}`} className="w-10 h-10 rounded-full object-cover" alt={selectedUser.name} />
                {isFollowing && selectedUser.showOnlineStatus !== false && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{selectedUser.name}</p>
                <p className="text-xs text-gray-400">
                  {!isFollowing ? 'Chưa theo dõi' : !selectedAllowsMessages ? 'Không nhận tin nhắn' : selectedUser.showOnlineStatus !== false ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </p>
              </div>
            </div>

            {/* Call buttons */}
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => startCall('audio')}
                disabled={!isFollowing || callState !== 'idle'}
                title="Gọi thoại"
                className={`group relative p-2.5 rounded-full transition-all ${isFollowing && callState === 'idle' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-300 cursor-not-allowed'}`}
              >
                <Phone className="w-5 h-5" />
                {isFollowing && callState === 'idle' && (
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Gọi thoại
                  </span>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => startCall('video')}
                disabled={!isFollowing || callState !== 'idle'}
                title="Gọi video"
                className={`group relative p-2.5 rounded-full transition-all ${isFollowing && callState === 'idle' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-300 cursor-not-allowed'}`}
              >
                <Video className="w-5 h-5" />
                {isFollowing && callState === 'idle' && (
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Gọi video
                  </span>
                )}
              </motion.button>

              <button className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notices */}
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
          {isFollowing && !selectedAllowsMessages && (
            <div className="mx-6 mt-4 px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl">
              <p className="text-sm text-gray-500 text-center"><span className="font-semibold">{selectedUser.name}</span> không nhận tin nhắn trực tiếp</p>
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
                const isImg = isImageMessage(msg.message)
                return (
                  <div key={msg.id} className={`flex gap-2 items-end group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && (
                      <img src={selectedUser.avatar || `https://i.pravatar.cc/32?u=${selectedUser.id}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt={selectedUser.name} />
                    )}
                    <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`${
                        (isImg || isCallEndedMessage(msg.message) || isCallMissedMessage(msg.message)) && !msg.deletedAt
                          ? 'p-0 bg-transparent border-none shadow-none'
                          : `px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'}`
                      }`}>
                        {msg.deletedAt ? (
                          <span className={`italic text-xs px-4 py-2.5 block rounded-2xl ${isMe ? 'bg-emerald-600 text-emerald-200' : 'bg-white text-gray-400 shadow-sm border border-gray-100'}`}>
                            {isMe ? 'Bạn đã xóa tin nhắn' : 'Tin nhắn đã bị xóa'} · {timeFormat(msg.deletedAt)}
                          </span>
                        ) : isImg ? (
                          <img
                            src={getImageUrl(msg.message)}
                            alt="Ảnh"
                            className="max-w-xs max-h-64 rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity block"
                            onClick={e => { e.stopPropagation(); window.open(getImageUrl(msg.message), '_blank') }}
                          />
                        ) : isCallEndedMessage(msg.message) ? (
                          (() => {
                            const { type, duration } = parseCallEnded(msg.message)
                            return (
                              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl ${
                                isMe
                                  ? 'bg-emerald-600 text-white rounded-br-sm'
                                  : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
                              }`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  type === 'video' ? 'bg-violet-500/20' : 'bg-emerald-500/20'
                                }`}>
                                  {type === 'video'
                                    ? <VideoIcon className={`w-4 h-4 ${isMe ? 'text-emerald-200' : 'text-violet-500'}`} />
                                    : <Phone className={`w-4 h-4 ${isMe ? 'text-emerald-200' : 'text-emerald-500'}`} />
                                  }
                                </div>
                                <div>
                                  <p className={`text-xs font-semibold ${isMe ? 'text-emerald-100' : 'text-gray-700'}`}>
                                    {type === 'video' ? '📹 Cuộc gọi video' : '📞 Cuộc gọi thoại'}
                                  </p>
                                  <p className={`text-[11px] mt-0.5 ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                                    Thời gian: {duration}
                                  </p>
                                </div>
                              </div>
                            )
                          })()
                        ) : isCallMissedMessage(msg.message) ? (
                          (() => {
                            const { type } = parseCallMissed(msg.message)
                            return (
                              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl ${
                                isMe
                                  ? 'bg-red-500/10 border border-red-200 rounded-br-sm'
                                  : 'bg-red-50 border border-red-100 rounded-bl-sm shadow-sm'
                              }`}>
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                  <PhoneMissed className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-red-600">
                                    {type === 'video' ? '📹 Cuộc gọi video nhỡ' : '📞 Cuộc gọi thoại nhỡ'}
                                  </p>
                                  <p className="text-[11px] mt-0.5 text-red-400">
                                    {isMe ? 'Không có ai trả lời' : 'Bạn đã bỏ lỡ cuộc gọi này'}
                                  </p>
                                </div>
                              </div>
                            )
                          })()
                        ) : (
                          msg.message
                        )}
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
                            {!isImg && (
                              <button
                                onClick={() => { navigator.clipboard.writeText(msg.message); setSelectedMsg(null) }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              ><span>📋</span> Sao chép</button>
                            )}
                            {isImg && (
                              <button
                                onClick={() => { window.open(getImageUrl(msg.message), '_blank'); setSelectedMsg(null) }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              ><span>🖼</span> Xem ảnh</button>
                            )}
                            {isMe && (
                              <button
                                onClick={() => { handleDeleteMessage(msg.id) }}
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

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className={`flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2 ${!canChat ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* + button with dropdown */}
              <div ref={plusMenuRef} className="relative">
                <button
                  onClick={() => setShowPlusMenu(v => !v)}
                  className="text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showPlusMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 6 }}
                      transition={{ duration: 0.13 }}
                      className="absolute left-0 bottom-full mb-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-30"
                    >
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                      >
                        <ImageIcon className="w-4 h-4 text-emerald-500" />
                        <span>Gửi ảnh</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Image button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
              >
                {uploadingImage
                  ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  : <Image className="w-5 h-5" />
                }
              </button>

              <input
                type="text"
                placeholder={
                  uploadingImage ? 'Đang gửi ảnh...' :
                  !isFollowing ? 'Theo dõi để nhắn tin...' :
                  !selectedAllowsMessages ? 'Người dùng không nhận tin nhắn' :
                  'Nhập tin nhắn...'
                }
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!canChat || uploadingImage}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />

              {/* Emoji picker */}
              <div ref={emojiPickerRef} className="relative">
                <button
                  onClick={() => setShowEmojiPicker(v => !v)}
                  className={`transition-colors ${showEmojiPicker ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-600'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 6 }}
                      transition={{ duration: 0.13 }}
                      className="absolute right-0 bottom-full mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-30 w-64"
                    >
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Biểu cảm</p>
                      <div className="grid grid-cols-10 gap-0.5">
                        {EMOJIS.map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => insertEmoji(emoji)}
                            className="w-8 h-8 text-lg hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending || !canChat}
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
