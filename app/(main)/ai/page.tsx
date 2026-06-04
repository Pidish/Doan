'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, Trash2, Loader2, Sparkles, Copy, Check, X } from 'lucide-react'
import { useRequireAuth } from '@/src/hooks/useRequireAuth'

interface AIMessage {
  id: string
  prompt: string
  response: string
  createdAt: string
}

const SUGGESTIONS = [
  'Viết cho tôi một caption Instagram hay về mùa hè',
  'Giải thích React hooks đơn giản nhất có thể',
  'Gợi ý 5 thói quen giúp tăng năng suất làm việc',
  'Viết một đoạn thơ ngắn về Hà Nội',
]

function renderResponse(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCode = false
  let codeLines: string[] = []
  let codeLang = ''
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLang = line.slice(3).trim()
        codeLines = []
      } else {
        inCode = false
        elements.push(
          <div key={key++} className="my-2 rounded-xl overflow-hidden border border-gray-200">
            {codeLang && (
              <div className="px-4 py-1.5 bg-gray-100 text-xs text-gray-500 font-mono border-b border-gray-200">{codeLang}</div>
            )}
            <pre className="p-4 bg-gray-50 text-sm text-gray-800 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
              {codeLines.join('\n')}
            </pre>
          </div>
        )
        codeLines = []
        codeLang = ''
      }
      continue
    }
    if (inCode) {
      codeLines.push(line)
      continue
    }

    // Bold **text**
    const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-[0.85em] font-mono">$1</code>')

    if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-sm font-bold text-gray-800 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: formatted.slice(4) }} />)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-base font-bold text-gray-900 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: formatted.slice(3) }} />)
    } else if (line.match(/^(\d+)\.\s/)) {
      elements.push(<li key={key++} className="ml-4 text-sm text-gray-700 list-decimal" dangerouslySetInnerHTML={{ __html: formatted }} />)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={key++} className="ml-4 text-sm text-gray-700 list-disc" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />)
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />)
    } else {
      elements.push(<p key={key++} className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />)
    }
  }
  return elements
}

export default function AIPage() {
  useRequireAuth()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    fetch('/api/ai', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setMessages(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  const send = async (text?: string) => {
    const prompt = (text ?? input).trim()
    if (!prompt || sending) return
    setInput('')
    setSending(true)
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.data) setMessages(prev => [...prev, data.data])
    } catch {}
    setSending(false)
  }

  const deleteOne = async (id: string) => {
    setDeletingId(id)
    const token = localStorage.getItem('accessToken')
    await fetch(`/api/ai/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setMessages(prev => prev.filter(m => m.id !== id))
    setDeletingId(null)
  }

  const clearAll = async () => {
    if (!confirm('Xóa toàn bộ lịch sử chat AI?')) return
    const token = localStorage.getItem('accessToken')
    await fetch('/api/ai', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setMessages([])
  }

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const timeLabel = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' +
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Nexora AI</h1>
            <p className="text-xs text-gray-400">Powered by Llama 3.3</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa lịch sử
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {messages.length === 0 && !sending ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Xin chào! Tôi là Nexora AI</h2>
                <p className="text-sm text-gray-500 mt-1">Hỏi tôi bất cứ điều gì — tôi luôn sẵn sàng giúp bạn</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="p-3 text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50 transition-all shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="flex flex-col gap-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="group relative max-w-[80%]">
                    <div className="px-4 py-3 bg-emerald-600 text-white rounded-2xl rounded-br-sm text-sm leading-relaxed">
                      {msg.prompt}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block text-right">{timeLabel(msg.createdAt)}</span>
                  </div>
                </div>

                {/* AI response */}
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="group flex-1 bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 p-4 min-w-0">
                    <div className="flex flex-col gap-0.5">
                      {renderResponse(msg.response)}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <span className="text-[10px] text-gray-400">{timeLabel(msg.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyText(msg.response, msg.id)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Sao chép"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteOne(msg.id)}
                          disabled={deletingId === msg.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Xóa"
                        >
                          {deletingId === msg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {sending && (
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-4 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-emerald-400 focus-within:bg-white transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhắn tin với Nexora AI... (Enter để gửi, Shift+Enter xuống dòng)"
              disabled={sending}
              className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-900 placeholder:text-gray-400 max-h-40 leading-relaxed disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">
            Nexora AI có thể mắc lỗi. Kiểm tra thông tin quan trọng.
          </p>
        </div>
      </div>
    </div>
  )
}
