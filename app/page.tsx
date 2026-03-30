import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center text-white">
      <h1 className="text-8xl font-black italic mb-6">Nexora</h1>
      <p className="text-2xl font-light text-emerald-100/70 mb-12 text-center max-w-lg">
        &ldquo;Sự tĩnh lặng không phải là sự vắng mặt của âm thanh, mà là sự hiện diện của chính mình.&rdquo;
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-8 py-4 bg-emerald-500 text-white rounded-full font-bold text-lg hover:bg-emerald-400 transition-all hover:-translate-y-1"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="px-8 py-4 bg-white/10 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all hover:-translate-y-1"
        >
          Đăng ký
        </Link>
      </div>
    </div>
  )
}