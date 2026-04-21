'use client'

import { useEffect } from 'react'

export function ThemeProvider() {
  useEffect(() => {
    const apply = (theme: string) => {
      const html = document.documentElement
      html.removeAttribute('data-theme')
      if (theme && theme !== 'light') html.setAttribute('data-theme', theme)
    }

    try {
      const saved = localStorage.getItem('nexora_settings')
      if (saved) apply(JSON.parse(saved).theme || 'light')
    } catch {}

    const handler = (e: Event) => apply((e as CustomEvent<string>).detail)
    window.addEventListener('nexora-theme', handler)
    return () => window.removeEventListener('nexora-theme', handler)
  }, [])

  return null
}
