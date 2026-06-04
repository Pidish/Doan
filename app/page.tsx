import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-8xl font-black italic mb-4">Nexora</h1>
      <p className="text-xl font-light text-emerald-100/60 mb-10 text-center max-w-md">
        &ldquo;Sự tĩnh lặng không phải là sự vắng mặt của âm thanh, mà là sự hiện diện của chính mình.&rdquo;
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/register"
          className="flex-1 text-center px-6 py-3.5 bg-emerald-500 text-white rounded-full font-bold text-base hover:bg-emerald-400 transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-500/30"
        >
          Đăng ký
        </Link>
        <Link
          href="/login"
          className="flex-1 text-center px-6 py-3.5 bg-white/10 text-white rounded-full font-bold text-base hover:bg-white/20 transition-all hover:-translate-y-0.5"
        >
          Đăng nhập
        </Link>
      </div>

      <Link
        href="/explore"
        className="mt-5 flex items-center gap-2 text-emerald-300/70 hover:text-emerald-300 text-sm font-medium transition-colors"
      >
        <Compass className="w-4 h-4" />
        Khám phá không cần đăng ký
      </Link>
    </div>
  )
}
