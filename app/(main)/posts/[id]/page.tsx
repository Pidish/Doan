'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, MessageCircle, Loader2, Send } from 'lucide-react'

interface Liker {
  user: { id: string; name: string; avatar?: string }
}

interface Post {
  id: string
  content: string
  imageUrl?: string
  createdAt: string
  isLiked: boolean
  author: { id: string; name: string; email: string; avatar?: string }
  comments: Comment[]
  likes: Liker[]
  _count: { likes: number; comments: number }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; email: string; avatar?: string }
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likers, setLikers] = useState<Liker[]>([])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token || !id) return

    fetch(`/api/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setPost(d.data)
        setLiked(d.data?.isLiked ?? false)
        setLikeCount(d.data?._count?.likes ?? 0)
        setLikers(d.data?.likes ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleLike = async () => {
    const token = localStorage.getItem('accessToken')
    const res = await fetch(`/api/posts/${id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) {
      setLiked(data.liked)
      setLikeCount(prev => data.liked ? prev + 1 : prev - 1)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim()) return
    setPosting(true)
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment, postId: id })
      })
      const data = await res.json()
      if (res.ok) {
        setPost(prev => prev ? {
          ...prev,
          comments: [...prev.comments, data.data],
          _count: { ...prev._count, comments: prev._count.comments + 1 }
        } : prev)
        setNewComment('')
      }
    } finally { setPosting(false) }
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    return `${days} ngày trước`
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  )

  if (!post) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
      <p>Bài viết không tồn tại</p>
      <button onClick={() => router.back()} className="mt-4 text-emerald-600 hover:underline">Quay lại</button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-700 transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại
      </button>

      {/* Post */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={post.author.avatar || `https://i.pravatar.cc/48?u=${post.author.id}`}
            alt={post.author.name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
          <div>
            <p className="font-bold text-gray-900">{post.author.name}</p>
            <p className="text-xs text-gray-400">@{post.author.email.split('@')[0]} · {timeAgo(post.createdAt)}</p>
          </div>
        </div>

        <p className="text-gray-800 leading-relaxed mb-4">{post.content}</p>

        {post.imageUrl && (
          <img src={post.imageUrl} alt="Post" className="rounded-xl w-full object-cover mb-4" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 text-gray-400 pt-3 border-t border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-all active:scale-90 ${liked ? 'text-rose-500' : 'hover:text-rose-500'}`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>
          <span className="flex items-center gap-1.5 text-sm">
            <MessageCircle className="w-5 h-5" />
            {post._count.comments}
          </span>
        </div>
      </div>

      {/* Likers */}
      {likers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-current" />
            {likeCount} người đã thích
          </h3>
          <div className="flex flex-wrap gap-3">
            {likers.map(({ user }) => (
              <div key={user.id} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                <img
                  src={user.avatar || `https://i.pravatar.cc/28?u=${user.id}`}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </div>
            ))}
            {likeCount > 20 && (
              <div className="flex items-center px-3 py-1.5 text-sm text-gray-400">
                +{likeCount - 20} người khác
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Bình luận ({post._count.comments})</h3>
        </div>

        <div className="divide-y divide-gray-50">
          {post.comments.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">Chưa có bình luận nào</p>
          ) : (
            post.comments.map(comment => (
              <div key={comment.id} className="flex gap-3 px-6 py-4">
                <img
                  src={comment.author.avatar || `https://i.pravatar.cc/36?u=${comment.author.id}`}
                  alt={comment.author.name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{comment.author.name}</span>
                    <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex gap-3 items-center bg-gray-100 rounded-full px-4 py-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Viết bình luận..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
            <button
              onClick={handleComment}
              disabled={!newComment.trim() || posting}
              className="text-emerald-600 hover:text-emerald-700 disabled:opacity-40 transition-colors"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
