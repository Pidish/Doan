'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, X } from 'lucide-react'
import { Post } from '../types'
import { motion, AnimatePresence } from 'framer-motion'

interface PostCardProps {
  post: Post
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    avatar?: string
    handle: string
  }
}

export function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentCount, setCommentCount] = useState(post.comments)
  const [loadingComments, setLoadingComments] = useState(false)
  const [posting, setPosting] = useState(false)
  const [copied, setCopied] = useState(false)

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('accessToken')
    : null

  // ─── Like ────────────────────────────────────────────────────
  const handleLike = async () => {
    // Optimistic update
    const prevLiked = liked
    const prevCount = likeCount
    setLiked(!liked)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        setLiked(prevLiked)
        setLikeCount(prevCount)
      }
    } catch {
      setLiked(prevLiked)
      setLikeCount(prevCount)
    }
  }

  // ─── Load Comments ───────────────────────────────────────────
  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true)
      try {
        const res = await fetch(`/api/comments?postId=${post.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setComments(data.data || [])
      } catch (err) {
        console.error('Comments error:', err)
      } finally {
        setLoadingComments(false)
      }
    }
    setShowComments(!showComments)
  }

  // ─── Post Comment ────────────────────────────────────────────
  const handlePostComment = async () => {
    if (!newComment.trim()) return
    setPosting(true)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment, postId: post.id })
      })
      const data = await res.json()
      if (res.ok) {
        setComments(prev => [...prev, {
          id: data.data.id,
          content: data.data.content,
          createdAt: data.data.createdAt,
          author: {
            id: data.data.author.id,
            name: data.data.author.name,
            avatar: data.data.author.avatar,
            handle: `@${data.data.author.email?.split('@')[0] || data.data.author.name}`
          }
        }])
        setCommentCount(prev => prev + 1)
        setNewComment('')
      }
    } catch (err) {
      console.error('Comment error:', err)
    } finally {
      setPosting(false)
    }
  }

  // ─── Share ───────────────────────────────────────────────────
  const handleShare = async () => {
    const url = `${window.location.origin}/home`
    const text = post.content.slice(0, 100) + '...'

    try {
      // ✅ Dùng Web Share API nếu browser hỗ trợ
      if (navigator.share) {
        await navigator.share({
          title: `${post.author.name} trên Nexora`,
          text: text,
          url: url,
        })
      } else {
        // Fallback — copy link
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Share error:', err)
    }
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

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex gap-4">
          <Link href={`/profile/${post.author.id}`} className="shrink-0">
            <img
              src={post.author.avatar || `https://i.pravatar.cc/48?u=${post.author.id}`}
              alt={post.author.name}
              className="w-12 h-12 rounded-full object-cover hover:opacity-90 transition-opacity"
            />
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link href={`/profile/${post.author.id}`} className="font-bold text-gray-900 hover:text-emerald-700 transition-colors">{post.author.name}</Link>
                <span className="text-xs text-gray-400">
                  {typeof post.timestamp === 'string' && post.timestamp.includes('trước')
                    ? post.timestamp
                    : timeAgo(post.timestamp)}
                </span>
              </div>
              <button className="text-gray-400 hover:text-emerald-700 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>

            {post.image && (
              <div className="rounded-xl overflow-hidden mb-4 bg-gray-100">
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full h-auto aspect-video object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 text-gray-400">
              {/* Like */}
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-all active:scale-90 ${liked ? 'text-rose-500' : 'hover:text-rose-500'
                  }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likeCount}</span>
              </button>

              {/* Comment */}
              <button
                onClick={handleToggleComments}
                className="flex items-center gap-1.5 hover:text-blue-500 transition-colors active:scale-90"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{commentCount}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className={`flex items-center gap-1.5 transition-colors active:scale-90 ml-auto ${copied ? 'text-emerald-600' : 'hover:text-emerald-600'
                  }`}
              >
                <Share2 className="w-5 h-5" />
                {copied && <span className="text-xs font-medium">Đã copy!</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {loadingComments ? (
                <p className="text-center text-gray-400 text-sm py-4">Đang tải...</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">Chưa có bình luận nào</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Link href={`/profile/${comment.author.id}`} className="flex-shrink-0">
                      <img
                        src={comment.author.avatar || `https://i.pravatar.cc/32?u=${comment.author.id}`}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full object-cover hover:opacity-90 transition-opacity"
                      />
                    </Link>
                    <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-2.5">
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

            {/* Comment Input */}
            <div className="px-4 pb-4">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex-shrink-0"></div>
                <div className="flex-1 flex gap-2 bg-gray-100 rounded-full px-4 py-2 items-center">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                    placeholder="Viết bình luận..."
                    className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || posting}
                    className="text-emerald-600 hover:text-emerald-700 disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}