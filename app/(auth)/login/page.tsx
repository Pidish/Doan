'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 404) setError('Email không tồn tại')
        else if (res.status === 401) setError('Mật khẩu không đúng')
        else setError(data.error || 'Đăng nhập thất bại, vui lòng thử lại')
        return
      }

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))

      // ✅ Phân quyền theo role
      if (data.user.role === 'ADMIN') {
        router.push('/admin')        // → Trang admin
      } else {
        router.push('/home')         // → Trang mạng xã hội
      }

    } catch {
      setError('Không thể kết nối server')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO5bVeWn0qQLFQRgnV8vWrjaHqPpFJcVxYNyTCwJQwXpvJMJ4558NhbZr2V0vWDc3IKvw6gTTi_KmWCiMJoL7SQqoGTI5tn5wizM2Y8DyrykGM2ZszM24jmu5tCeK9r9JSvgvIYS808fminLcqhX89PFjkR0AAxNnZrUD7fEE7RVdxg57_L5HFPbA_dfWnCJ_GItZTe68olXPpTnMCsoyl9XnwcYOQunqfNN_oxjS4WXG-Kr0i8eq8OLUjWqDte_TjC3AmDECEPsGN"
          alt="Login background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px] flex flex-col justify-end p-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md text-white space-y-6"
          >
            <h1 className="text-6xl font-black italic">Nexora</h1>
            <p className="text-2xl font-light leading-relaxed">
              &ldquo;Sự tĩnh lặng không phải là sự vắng mặt của âm thanh, mà là sự hiện diện của chính mình.&rdquo;
            </p>
            <div className="pt-10 flex items-center gap-4">
              <div className="w-12 h-[2px] bg-white/40"></div>
              <span className="text-sm font-bold uppercase tracking-widest opacity-60">Digital Sanctuary</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 md:p-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-10"
        >
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-emerald-950">Chào mừng trở lại</h2>
            <p className="text-gray-500">Đăng nhập để tiếp tục hành trình của bạn.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Mật khẩu</label>
                <a href="#" className="text-xs font-bold text-emerald-600 hover:underline">Quên mật khẩu?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Đăng nhập <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-emerald-700 font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}