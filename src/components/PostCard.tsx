'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, Link2, Copy, ExternalLink, Check, Repeat2, X, Loader2 } from 'lucide-react'
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
  const [showShare, setShowShare] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'link' | 'text'>('idle')
  const [saved, setSaved] = useState(false)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [repostCaption, setRepostCaption] = useState('')
  const [reposting, setReposting] = useState(false)
  const [reposted, setReposted] = useState(false)
  const [repostCount, setRepostCount] = useState(post.reposts ?? 0)
  const shareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showShare) return
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShare(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShare])

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('accessToken')
    : null

  const handleLike = async () => {
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

  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : ''

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl)
    setCopyState('link')
    setTimeout(() => { setCopyState('idle'); setShowShare(false) }, 1500)
  }

  const copyText = async () => {
    await navigator.clipboard.writeText(post.content)
    setCopyState('text')
    setTimeout(() => { setCopyState('idle'); setShowShare(false) }, 1500)
  }

  const nativeShare = async () => {
    await navigator.share({ title: `${post.author.name} trên Nexora`, text: post.content.slice(0, 100), url: postUrl })
    setShowShare(false)
  }

  const handleRepost = async () => {
    setReposting(true)
    try {
      const res = await fetch('/api/posts/repost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: post.id, caption: repostCaption }),
      })
      const data = await res.json()
      if (res.ok) {
        setReposted(true)
        setRepostCount(c => c + 1)
        setShowRepostModal(false)
        setRepostCaption('')
      } else {
        alert(data.error || 'Không thể repost')
      }
    } catch {
      alert('Lỗi kết nối')
    } finally {
      setReposting(false)
    }
  }

  const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi)(\?.*)?$/i.test(url)

  const timeAgo = (date: string) => {
    if (!date) return 'vừa xong'
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return 'vừa xong'
    const diff = Date.now() - parsed.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'vừa xong'
    if (mins < 60) return `${mins} phút`
    if (hours < 24) return `${hours} giờ`
    return `${days} ngày`
  }

  return (
    <>
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-shadow duration-300 group"
    >
      <div className="p-5 md:p-6">
        {/* Repost label */}
        {post.repost && (
          <div className="flex items-center gap-1.5 text-xs mb-3 -mt-1">
            <Repeat2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="text-gray-400">Đã chia sẻ bài viết của</span>
            <span className="text-emerald-600 font-semibold truncate">{post.repost!.author.name}</span>
          </div>
        )}

        {/* Author row — always shows the post owner (reposter for reposts) */}
        <div className="flex gap-3 mb-4">
          <Link href={`/profile/${post.author.id}`} className="shrink-0 mt-0.5">
            <img
              src={post.author.avatar || `https://i.pravatar.cc/48?u=${post.author.id}`}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white hover:ring-emerald-300 transition-all"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/profile/${post.author.id}`} className="font-bold text-gray-900 hover:text-emerald-700 transition-colors text-sm leading-tight block truncate">
                  {post.author.name}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">
                  {`${post.author.handle} · ${typeof post.timestamp === 'string' && post.timestamp.includes('trước') ? post.timestamp : timeAgo(post.timestamp) + ' trước'}`}
                </p>
              </div>
              <button className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100 flex-shrink-0 -mt-0.5">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Caption (when repost has caption) */}
        {post.repost && post.content && (
          <p className="text-gray-600 text-sm mb-3">{post.content}</p>
        )}

        {/* Normal post content */}
        {!post.repost && (
          <p className="text-gray-800 text-sm leading-relaxed mb-4">{post.content}</p>
        )}

        {/* Embedded original post — shows original author + content */}
        {post.repost && (
          <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50/60 hover:bg-gray-100/60 transition-colors cursor-pointer" onClick={() => window.location.href = `/posts/${post.repost!.id}`}>
            <div className="flex items-center gap-2 mb-2.5">
              <img
                src={post.repost.author.avatar || `https://i.pravatar.cc/32?u=${post.repost.author.id}`}
                alt={post.repost.author.name}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
              <span className="font-bold text-xs text-gray-900">{post.repost.author.name}</span>
              <span className="text-xs text-gray-400">@{post.repost.author.email.split('@')[0]}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-gray-400">{timeAgo(post.repost.createdAt)} trước</span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">{post.repost.content}</p>
          </div>
        )}

        {/* Image / Video */}
        {post.image && (
          <div className="rounded-xl overflow-hidden mb-4 bg-gray-50 border border-gray-100">
            {isVideoUrl(post.image) ? (
              <video
                src={post.image}
                controls
                className="w-full max-h-[480px] object-contain"
                preload="metadata"
              />
            ) : (
              <img
                src={post.image}
                alt="Post content"
                className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
              />
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1 -mx-1.5">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-90 ${
              liked ? 'text-rose-500 bg-rose-50' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'
            }`}
          >
            <Heart className={`w-4 h-4 transition-all ${liked ? 'fill-current scale-110' : ''}`} />
            <span>{likeCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={handleToggleComments}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-90 ${
              showComments ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentCount}</span>
          </button>

          {/* Repost button */}
          <button
            onClick={() => { if (!post.repost) setShowRepostModal(true) }}
            disabled={!!post.repost}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-90 ${
              reposted ? 'text-emerald-600 bg-emerald-50' :
              post.repost ? 'text-gray-300 cursor-not-allowed' :
              'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Repeat2 className="w-4 h-4" />
            <span>{repostCount}</span>
          </button>

          {/* Share */}
          <div ref={shareRef} className="relative">
            <button
              onClick={() => setShowShare(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-90 ${
                showShare ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <Share2 className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showShare && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 bottom-full mb-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-30"
                >
                  <div className="px-4 py-2.5 border-b border-gray-50">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Chia sẻ bài viết</p>
                  </div>

                  {/* Repost on Nexora */}
                  {!post.repost && (
                    <button
                      onClick={() => { setShowShare(false); setShowRepostModal(true) }}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors border-b border-gray-50 ${
                        reposted ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-700 hover:bg-emerald-50'
                      }`}
                    >
                      <Repeat2 className={`w-4 h-4 flex-shrink-0 ${reposted ? 'text-emerald-500' : 'text-gray-400'}`} />
                      <span className={reposted ? 'font-semibold' : ''}>
                        {reposted ? 'Đã đăng lại' : 'Đăng lại trên Nexora'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={copyLink}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {copyState === 'link' ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    <span className={copyState === 'link' ? 'text-emerald-600 font-semibold' : ''}>
                      {copyState === 'link' ? 'Đã sao chép!' : 'Sao chép liên kết'}
                    </span>
                  </button>

                  <button
                    onClick={copyText}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {copyState === 'text' ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Copy className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    <span className={copyState === 'text' ? 'text-emerald-600 font-semibold' : ''}>
                      {copyState === 'text' ? 'Đã sao chép!' : 'Sao chép nội dung'}
                    </span>
                  </button>

                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={nativeShare}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>Chia sẻ qua ứng dụng</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => setSaved(!saved)}
            className={`ml-auto flex items-center px-2.5 py-1.5 rounded-full text-sm transition-all active:scale-90 ${
              saved ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 bg-gray-50/60"
          >
            <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
              {loadingComments ? (
                <p className="text-center text-gray-400 text-xs py-4">Đang tải...</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-4">Chưa có bình luận nào · Hãy là người đầu tiên!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-2.5">
                    <Link href={`/profile/${comment.author.id}`} className="flex-shrink-0">
                      <img
                        src={comment.author.avatar || `https://i.pravatar.cc/32?u=${comment.author.id}`}
                        alt={comment.author.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm border border-gray-100">
                      <div className="flex items-baseline gap-1.5 mb-0.5">
                        <span className="font-semibold text-xs text-gray-900">{comment.author.name}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)} trước</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="px-4 pb-4">
              <div className="flex gap-2.5 items-center bg-white rounded-full px-4 py-2.5 shadow-sm border border-gray-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                  placeholder="Viết bình luận..."
                  className="flex-1 bg-transparent outline-none text-xs text-gray-900 placeholder:text-gray-400"
                />
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim() || posting}
                  className="text-emerald-600 hover:text-emerald-700 disabled:opacity-30 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>

    {/* Repost Modal */}
    <AnimatePresence>
      {showRepostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Repeat2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-gray-900">
                  Đăng lại bài của{' '}
                  <span className="text-emerald-600">{post.author.name}</span>
                </span>
              </div>
              <button onClick={() => setShowRepostModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Caption input */}
              <textarea
                value={repostCaption}
                onChange={e => setRepostCaption(e.target.value)}
                placeholder="Thêm suy nghĩ của bạn... (không bắt buộc)"
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 resize-none outline-none focus:ring-2 focus:ring-emerald-200 border border-transparent focus:border-emerald-200 transition-all"
                rows={3}
                maxLength={300}
              />

              {/* Original post preview */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={post.author.avatar || `https://i.pravatar.cc/24?u=${post.author.id}`}
                    className="w-6 h-6 rounded-full object-cover"
                    alt={post.author.name}
                  />
                  <span className="text-xs font-semibold text-gray-700">{post.author.name}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{post.content}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setShowRepostModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleRepost}
                disabled={reposting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {reposting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang đăng...</>
                  : <><Repeat2 className="w-4 h-4" /> Đăng lại</>
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  )
}
