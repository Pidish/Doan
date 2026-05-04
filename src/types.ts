export interface User {
  id: string
  name: string
  handle: string
  avatar: string
  bio?: string
  isPremium?: boolean
  role?: string
}

export interface Post {
  id: string
  author: {
    id: string
    name: string
    handle?: string
    avatar?: string
  }
  content: string
  timestamp: string
  likes: number
  comments: number
  reposts?: number
  image?: string
  isLiked?: boolean
  repost?: {
    id: string
    content: string
    createdAt: string
    author: { id: string; name: string; email: string; avatar?: string }
  } | null
}

export interface Notification {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  participant: {
    id: string
    name: string
    handle: string
    avatar: string
  }
  lastMessage: string
  timestamp: string
  unread?: boolean
}
