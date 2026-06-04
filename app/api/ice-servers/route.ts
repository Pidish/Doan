import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

const FALLBACK_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  {
    urls: [
      'stun:freestun.net:3478',
      'turn:freestun.net:3478',
      'turns:freestun.net:5349',
    ],
    username: 'free',
    credential: 'free',
  },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turns:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

export async function GET(req: NextRequest) {
  const result = verifyAccessToken(req)
  if (!result.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.METERED_API_KEY
  const appName = process.env.METERED_APP_NAME

  if (apiKey && appName) {
    try {
      const res = await fetch(
        `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
        { next: { revalidate: 300 } }
      )
      if (res.ok) {
        const iceServers = await res.json()
        return NextResponse.json({ iceServers })
      }
    } catch (err) {
      console.error('[ICE] Metered.ca fetch failed, using fallback:', err)
    }
  }

  return NextResponse.json({ iceServers: FALLBACK_ICE_SERVERS })
}
