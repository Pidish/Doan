'use client'

import { useEffect } from 'react'

const THEME_STYLES: Record<string, string> = {
  light: '',

  dark: `
    html[data-theme="dark"] {
      color-scheme: dark;
    }
    html[data-theme="dark"] body {
      background-color: #0f172a !important;
      color: #f1f5f9 !important;
    }
    html[data-theme="dark"] .bg-white {
      background-color: #1e293b !important;
    }
    html[data-theme="dark"] .bg-white\\/60,
    html[data-theme="dark"] .bg-white\\/80 {
      background-color: #1e293b !important;
    }
    html[data-theme="dark"] .bg-gray-50 {
      background-color: #0f172a !important;
    }
    html[data-theme="dark"] .bg-gray-100 {
      background-color: #1e293b !important;
    }
    html[data-theme="dark"] .bg-gray-200 {
      background-color: #334155 !important;
    }
    html[data-theme="dark"] .bg-emerald-50 {
      background-color: #0a1f12 !important;
    }
    html[data-theme="dark"] .bg-emerald-50\\/30 {
      background-color: rgba(10,31,18,0.3) !important;
    }
    html[data-theme="dark"] .text-gray-900 {
      color: #f1f5f9 !important;
    }
    html[data-theme="dark"] .text-gray-800 {
      color: #e2e8f0 !important;
    }
    html[data-theme="dark"] .text-gray-700 {
      color: #cbd5e1 !important;
    }
    html[data-theme="dark"] .text-gray-600 {
      color: #94a3b8 !important;
    }
    html[data-theme="dark"] .text-gray-500 {
      color: #64748b !important;
    }
    html[data-theme="dark"] .text-gray-400 {
      color: #475569 !important;
    }
    html[data-theme="dark"] .text-emerald-900 {
      color: #a7f3d0 !important;
    }
    html[data-theme="dark"] .text-emerald-800 {
      color: #6ee7b7 !important;
    }
    html[data-theme="dark"] .border-gray-100 {
      border-color: #1e293b !important;
    }
    html[data-theme="dark"] .border-gray-200 {
      border-color: #334155 !important;
    }
    html[data-theme="dark"] .divide-gray-50 > * + * {
      border-color: #1e293b !important;
    }
    html[data-theme="dark"] .divide-gray-100 > * + * {
      border-color: #334155 !important;
    }
    html[data-theme="dark"] input:not([type="checkbox"]):not([type="radio"]):not([class*="bg-emerald"]):not([class*="bg-rose"]) {
      background-color: #0f172a !important;
      color: #f1f5f9 !important;
    }
    html[data-theme="dark"] textarea {
      background-color: #0f172a !important;
      color: #f1f5f9 !important;
    }
    html[data-theme="dark"] input::placeholder,
    html[data-theme="dark"] textarea::placeholder {
      color: #475569 !important;
    }
    html[data-theme="dark"] .hover\\:bg-gray-50:hover {
      background-color: #1e293b !important;
    }
    html[data-theme="dark"] .hover\\:bg-gray-100:hover {
      background-color: #334155 !important;
    }
    html[data-theme="dark"] .shadow-sm {
      box-shadow: 0 1px 2px 0 rgba(0,0,0,0.4) !important;
    }
    html[data-theme="dark"] .shadow-2xl {
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7) !important;
    }
  `,

  nexora: `
    html[data-theme="nexora"] {
      color-scheme: dark;
    }
    html[data-theme="nexora"] body {
      background-color: #021008 !important;
      color: #dcfce7 !important;
    }
    html[data-theme="nexora"] .bg-white {
      background-color: #0a1f12 !important;
    }
    html[data-theme="nexora"] .bg-white\\/60,
    html[data-theme="nexora"] .bg-white\\/80 {
      background-color: #0a1f12 !important;
    }
    html[data-theme="nexora"] .bg-gray-50 {
      background-color: #021008 !important;
    }
    html[data-theme="nexora"] .bg-gray-100 {
      background-color: #0a1f12 !important;
    }
    html[data-theme="nexora"] .bg-gray-200 {
      background-color: #1a3d24 !important;
    }
    html[data-theme="nexora"] .bg-emerald-50 {
      background-color: #021008 !important;
    }
    html[data-theme="nexora"] .text-gray-900 {
      color: #dcfce7 !important;
    }
    html[data-theme="nexora"] .text-gray-800 {
      color: #bbf7d0 !important;
    }
    html[data-theme="nexora"] .text-gray-700 {
      color: #86efac !important;
    }
    html[data-theme="nexora"] .text-gray-600 {
      color: #4ade80 !important;
    }
    html[data-theme="nexora"] .text-gray-500 {
      color: #22c55e !important;
    }
    html[data-theme="nexora"] .text-gray-400 {
      color: #16a34a !important;
    }
    html[data-theme="nexora"] .text-emerald-900 {
      color: #dcfce7 !important;
    }
    html[data-theme="nexora"] .text-emerald-800 {
      color: #bbf7d0 !important;
    }
    html[data-theme="nexora"] .border-gray-100 {
      border-color: #0a1f12 !important;
    }
    html[data-theme="nexora"] .border-gray-200 {
      border-color: #1a3d24 !important;
    }
    html[data-theme="nexora"] .divide-gray-50 > * + *,
    html[data-theme="nexora"] .divide-gray-100 > * + * {
      border-color: #1a3d24 !important;
    }
    html[data-theme="nexora"] input:not([type="checkbox"]):not([type="radio"]) {
      background-color: #021008 !important;
      color: #dcfce7 !important;
    }
    html[data-theme="nexora"] textarea {
      background-color: #021008 !important;
      color: #dcfce7 !important;
    }
    html[data-theme="nexora"] .hover\\:bg-gray-50:hover {
      background-color: #0a1f12 !important;
    }
    html[data-theme="nexora"] .hover\\:bg-gray-100:hover {
      background-color: #1a3d24 !important;
    }
    html[data-theme="nexora"] .shadow-sm {
      box-shadow: 0 1px 2px 0 rgba(0,0,0,0.5) !important;
    }
  `,
}

function applyTheme(theme: string) {
  const html = document.documentElement

  // Set data-theme attribute
  if (theme === 'light') {
    html.removeAttribute('data-theme')
  } else {
    html.setAttribute('data-theme', theme)
  }

  // Inject/update <style> tag
  let el = document.getElementById('nexora-theme') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'nexora-theme'
    document.head.appendChild(el)
  }
  el.textContent = THEME_STYLES[theme] ?? ''
}

export function ThemeProvider() {
  useEffect(() => {
    // Apply saved theme on mount
    try {
      const saved = localStorage.getItem('nexora_settings')
      if (saved) {
        const { theme } = JSON.parse(saved)
        if (theme) applyTheme(theme)
      }
    } catch {}

    // Listen for theme change events
    const handler = (e: Event) => applyTheme((e as CustomEvent<string>).detail)
    window.addEventListener('nexora-theme', handler)
    return () => window.removeEventListener('nexora-theme', handler)
  }, [])

  return null
}
