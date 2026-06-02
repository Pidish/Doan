'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import PusherClient from 'pusher-js'
import { Phone, PhoneOff, VideoIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PendingCall {
  fromUserId: string
  fromUserName: string
  fromUserAvatar?: string
  callType: 'audio' | 'video'
  offer: RTCSessionDescriptionInit
}

export function GlobalCallReceiver() {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<PendingCall | null>(null)
  const incomingCallRef = useRef<PendingCall | null>(null)

  useEffect(() => { incomingCallRef.current = incomingCall }, [incomingCall])

  // Get current user id on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d?.data?.id) setCurrentUserId(d.data.id) })
      .catch(() => {})
  }, [])

  // Subscribe to personal call channel
  useEffect(() => {
    if (!currentUserId) return

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const ch = pusher.subscribe(`user-${currentUserId}`)

    ch.bind('call-signal', (payload: { type: string; fromUserId: string; data: Record<string, unknown> }) => {
      // Always forward to messages page (or any listener) via window event
      window.dispatchEvent(new CustomEvent('nexora:call-signal', { detail: payload }))

      // Show overlay UI only when NOT on messages page (messages page has its own full UI)
      if (window.location.pathname.startsWith('/messages')) return

      if (payload.type === 'call-offer') {
        setIncomingCall({
          fromUserId: payload.fromUserId,
          fromUserName: (payload.data.fromUserName as string) || 'Người dùng',
          fromUserAvatar: payload.data.fromUserAvatar as string | undefined,
          callType: (payload.data.callType as 'audio' | 'video') || 'audio',
          offer: payload.data.offer as RTCSessionDescriptionInit,
        })
      } else if (payload.type === 'call-end' || payload.type === 'call-reject') {
        setIncomingCall(null)
      }
    })

    return () => {
      ch.unbind_all()
      pusher.disconnect()
    }
  }, [currentUserId])

  // Clear overlay if user navigates to messages page
  useEffect(() => {
    if (pathname.startsWith('/messages') && incomingCallRef.current) {
      setIncomingCall(null)
    }
  }, [pathname])

  const handleDecline = async () => {
    if (!incomingCall) return
    const token = localStorage.getItem('accessToken')
    try {
      await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'call-reject', targetUserId: incomingCall.fromUserId, data: {} }),
      })
    } catch {}
    setIncomingCall(null)
  }

  const handleAnswer = () => {
    if (!incomingCall) return
    // Store offer so messages page can auto-show incoming call UI
    sessionStorage.setItem('nexora_pending_call', JSON.stringify(incomingCall))
    setIncomingCall(null)
    router.push('/messages')
  }

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          key="global-incoming-call"
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed top-4 right-4 z-[9999] w-[min(320px,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Accent bar */}
          <div className={`h-1 ${incomingCall.callType === 'video' ? 'bg-violet-500' : 'bg-emerald-500'}`} />

          <div className="p-4 flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={incomingCall.fromUserAvatar || `https://i.pravatar.cc/48?u=${incomingCall.fromUserId}`}
                alt={incomingCall.fromUserName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <motion.div
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                  incomingCall.callType === 'video' ? 'bg-violet-500' : 'bg-emerald-500'
                }`}
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                {incomingCall.callType === 'video'
                  ? <VideoIcon className="w-2.5 h-2.5 text-white" />
                  : <Phone className="w-2.5 h-2.5 text-white" />
                }
              </motion.div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{incomingCall.fromUserName}</p>
              <motion.p
                className="text-xs text-gray-400 mt-0.5"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {incomingCall.callType === 'video' ? 'Cuộc gọi video đến...' : 'Cuộc gọi thoại đến...'}
              </motion.p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleDecline}
                className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleAnswer}
                className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors shadow-sm"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <Phone className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
