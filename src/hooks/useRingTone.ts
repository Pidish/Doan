'use client'
import { useEffect, useRef } from 'react'

export function useRingTone(active: boolean) {
  const ctxRef  = useRef<AudioContext | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aliveRef = useRef(false)

  useEffect(() => {
    if (active) {
      start()
    } else {
      stop()
    }
    return stop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  function playBurst(ctx: AudioContext, delay: number) {
    // Two-tone phone ring: 480 Hz + 440 Hz mixed
    for (const freq of [480, 440]) {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + delay)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.05)
      gain.gain.setValueAtTime(0.18, ctx.currentTime + delay + 0.35)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.45)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + 0.5)
    }
  }

  function scheduleRing() {
    if (!aliveRef.current || !ctxRef.current) return
    const ctx = ctxRef.current
    // Pattern: burst at 0s, burst at 0.6s, silence until 3s, repeat
    playBurst(ctx, 0)
    playBurst(ctx, 0.6)
    timerRef.current = setTimeout(scheduleRing, 3000)
  }

  function start() {
    stop()
    const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    ctxRef.current  = new Ctx()
    aliveRef.current = true
    scheduleRing()
  }

  function stop() {
    aliveRef.current = false
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
  }
}
