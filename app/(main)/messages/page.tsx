'use client'

import { CONVERSATIONS } from '@/src/constants'
import { Search, Edit3, Video, Phone, Info, PlusCircle, Image, Smile, Send } from 'lucide-react'

export default function MessagesPage() {
  return (
    <div className="flex h-screen">
      {/* Conversation List */}
      <section className="w-96 h-full flex flex-col bg-white border-r border-gray-100">
        <header className="p-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tin nhắn</h2>
            <button className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-full hover:shadow-lg transition-all">
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm hội thoại..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4">
          {CONVERSATIONS.map((conv) => (
            <div
              key={conv.id}
              className={`p-4 mb-2 rounded-2xl flex gap-4 cursor-pointer transition-all ${
                conv.unread ? 'bg-emerald-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={conv.participant.avatar}
                  alt={conv.participant.name}
                  className="w-14 h-14 rounded-full border-2 border-white shadow-sm"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{conv.participant.name}</h3>
                  <span className="text-[10px] text-gray-400 font-medium">{conv.timestamp}</span>
                </div>
                <p className={`text-sm truncate ${conv.unread ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {conv.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Chat Area */}
      <section className="flex-1 flex flex-col bg-gray-50">
        <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={CONVERSATIONS[0].participant.avatar}
                className="w-10 h-10 rounded-full"
                alt="Active chat"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight">{CONVERSATIONS[0].participant.name}</h2>
              <p className="text-[11px] text-emerald-600 font-medium">Đang hoạt động</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:bg-gray-100 transition-colors rounded-full">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:bg-gray-100 transition-colors rounded-full">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:bg-gray-100 transition-colors rounded-full">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-8">
          <div className="flex justify-center">
            <span className="bg-gray-200/50 text-gray-500 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">Hôm nay</span>
          </div>

          <div className="flex gap-4 max-w-[80%]">
            <img src={CONVERSATIONS[0].participant.avatar} className="w-8 h-8 rounded-full flex-shrink-0 self-end mb-1" alt="Sender" />
            <div className="flex flex-col gap-1">
              <div className="bg-emerald-100 text-emerald-900 p-5 rounded-[24px] leading-relaxed shadow-sm">
                Chào bạn! Tôi vừa xem qua bản cập nhật mới nhất của thiết kế Nexora trên Figma.
              </div>
              <span className="text-[10px] text-gray-400 ml-2">10:05 AM</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 self-end max-w-[80%]">
            <div className="bg-emerald-700 text-white p-5 rounded-[24px] leading-relaxed shadow-lg">
              Cảm ơn Lâm nhiều nhé! Mình đã dành rất nhiều thời gian để chọn tông màu xanh ngọc lục bảo này đấy.
            </div>
            <span className="text-[10px] text-gray-400 mr-2">10:10 AM</span>
          </div>
        </div>

        <footer className="p-8 pt-2">
          <div className="bg-white rounded-full px-6 py-4 flex items-center gap-4 shadow-sm focus-within:shadow-md transition-all">
            <button className="text-gray-400 hover:text-emerald-700 transition-colors">
              <PlusCircle className="w-6 h-6" />
            </button>
            <button className="text-gray-400 hover:text-emerald-700 transition-colors">
              <Image className="w-6 h-6" />
            </button>
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-gray-900 py-0"
            />
            <button className="text-gray-400 hover:text-emerald-700 transition-colors">
              <Smile className="w-6 h-6" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center bg-emerald-700 text-white rounded-full shadow-md active:scale-95 transition-transform">
              <Send className="w-5 h-5 fill-current" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}