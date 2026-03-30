'use client'

import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import { Post } from '../types'
import { motion } from 'framer-motion'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
    >
      <div className="flex gap-4">
        <img
          src={post.author.avatar}
          alt={post.author.name}
          className="w-12 h-12 rounded-full object-cover shrink-0"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-bold text-gray-900">{post.author.name}</h4>
              <span className="text-xs text-gray-400">{post.timestamp}</span>
            </div>
            <button className="text-gray-400 hover:text-emerald-700 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-800 mb-4 leading-relaxed text-lg">
            {post.content}
          </p>

          {post.image && (
            <div className="rounded-xl overflow-hidden mb-4 bg-gray-100">
              <img
                src={post.image}
                alt="Post content"
                className="w-full h-auto aspect-video object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          )}

          <div className="flex items-center gap-6 text-gray-400">
            <button className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors active:scale-90">
              <Heart className="w-5 h-5" />
              <span className="text-sm">{post.likes}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors active:scale-90">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{post.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors active:scale-90 ml-auto">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}