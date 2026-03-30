'use client'

import { Bell, UserPlus, Heart, AtSign } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NotificationsPage() {
  const filters = [
    { icon: Bell, label: 'Tất cả', count: 12, active: true },
    { icon: AtSign, label: 'Nhắc đến', count: 3 },
    { icon: Heart, label: 'Lượt thích', count: 5 },
    { icon: UserPlus, label: 'Người theo dõi mới', count: 4 },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 md:p-10 pt-24 md:pt-10">
      {/* Filter Sidebar */}
      <div className="lg:w-1/3 space-y-6">
        <section className="bg-emerald-50 rounded-2xl p-6 sticky top-28">
          <h3 className="text-lg font-bold text-emerald-900 mb-6">Bộ lọc thông báo</h3>
          <nav className="flex flex-col gap-2">
            {filters.map((f) => (
              <button
                key={f.label}
                className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all hover:translate-x-1 ${
                  f.active
                    ? 'bg-white text-emerald-900 shadow-sm font-semibold'
                    : 'text-emerald-800/70 hover:bg-white/40'
                }`}
              >
                <span className="flex items-center gap-3">
                  <f.icon className={`w-5 h-5 ${f.active ? 'text-emerald-600' : ''}`} />
                  {f.label}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  f.active ? 'bg-emerald-700 text-white' : 'border border-emerald-800/20'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </nav>
          <div className="mt-10 p-5 bg-emerald-100/50 rounded-2xl border border-emerald-200/50">
            <p className="text-xs font-bold text-emerald-900 mb-1">Mẹo nhỏ</p>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Bạn có thể tùy chỉnh thông báo đẩy trong phần{' '}
              <a href="#" className="underline font-bold">Cài đặt</a>{' '}
              để có trải nghiệm yên tĩnh hơn.
            </p>
          </div>
        </section>
      </div>

      {/* Notifications List */}
      <div className="lg:w-2/3 flex flex-col gap-10">
        <h2 className="text-2xl font-bold tracking-tight text-emerald-900">Thông báo</h2>

        <div className="space-y-10">
          {/* Follow notification */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-6"
          >
            <div className="relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8aedGeFp2R0oUVPqcoNp9_TxdwvPfI5s9MeqSWUun2rFLkLfpFgZ9yonFPQr0hTq2fsa9aiSFFHnUuTjwReMnzqtQqkMiwIVSv0t575X_Tc5LQmNbkWDfMKPByB72_ehlFxxgA23dzHZCyZt91lzoo_oBUQaVcHk4lj7GThVI_nlucsx2-Xi9d-wBjdEQUqD7USs8G1ngvkzOlvFOFmQJ_G87oSOwwkpN6y9aiP47JuuvYulMYqVJrGb7zC-stqaRTmI45hNofOi_"
                alt="User"
                className="w-14 h-14 rounded-full border-2 border-white shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-700 text-white p-1 rounded-full border-2 border-white">
                <UserPlus className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-1">
                <h4 className="font-bold text-lg text-emerald-950">Hoàng Nam đã theo dõi bạn</h4>
                <span className="text-[11px] text-gray-400 font-medium">10 phút trước</span>
              </div>
              <p className="text-gray-500 leading-relaxed text-sm mb-4 italic">
                &ldquo;Rất thích các bài viết về thiền định của bạn!&rdquo;
              </p>
              <button className="px-6 py-2 bg-emerald-700 text-white rounded-full text-sm font-bold shadow-sm active:scale-95 transition-all">
                Theo dõi lại
              </button>
            </div>
          </motion.div>

          {/* Like notification */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-6"
          >
            <div className="relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8WSEdtDNO7rC9NO922ztSV85xdPhv8ui9Dmgz_kYJseJsdbHSpEmyCqXjswcCLeNEtoGO74575YKuxczg--5EsdM1-iR0VDD2nfC7lBR9fKBgHJ7GiDczinw8Q_AJZNrIh6X0wJQEXiy0Hjn1W4uFXZ5pDAd0geazZrGwv0Q6Yr0pKNq75eRhL5YC7OcUwrSNSVwJptN8qFUfw4z7r2xJiqyPEFjr54iBMkFMzY2otS1p5URZuto4mxTfOcUlUJ8DZI1a7SducPH2"
                alt="User"
                className="w-14 h-14 rounded-full border-2 border-white shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1 rounded-full border-2 border-white">
                <Heart className="w-3 h-3 fill-current" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-1">
                <h4 className="font-bold text-lg text-emerald-950">Thúy Vy và 4 người khác đã thích ảnh của bạn</h4>
                <span className="text-[11px] text-gray-400 font-medium">1 giờ trước</span>
              </div>
              <div className="mt-3 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAoIM8tgmAOh4k--_KkjX9v6enAIAR3ckoya9fK_GdPJzyfHmQ04-pxFkWQba9qN1Az7TXvjdbqjRWrafik0iK7PnmS2nU89NvqGnCoYpyzjchNfYSVjOZWQAVLyTTFgG-r5CvQIwPRJjWZB8W-Q0qH5vacj0QTLA4SMhuTHFMLMLbuZnHVoTPaiAg6MeR9DxLeDrnTO_CA13U5TExO8c9sQCb22X2NqiXz60Age0OF8ZQS7AT55dlRgFnMZ6OKYOJOVfmpUqxUDg3"
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}