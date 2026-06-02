import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'
import { verifyAccessToken } from '@/lib/auth'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, targetUserId, data } = await req.json()
    if (!type || !targetUserId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const callerId = result.payload.id
    // Use the same personal channel as direct messages — already established and reliable
    const channelName = `user-${targetUserId}`

    await pusher.trigger(channelName, 'call-signal', {
      type,
      fromUserId: callerId,
      data,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Call signal error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
