'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, EyeOff, Trash2, ShieldAlert, Loader2 } from 'lucide-react'

interface Post {
    id: string
    content: string
    status: string
    category: string
    createdAt: string
    author: { id: string; name: string; email: string; avatar?: string }
    _count: { likes: number; comments: number }
}

export default function PostsPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchPosts = async () => {
        const token = localStorage.getItem('accessToken')
        try {
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (statusFilter) params.append('status', statusFilter)

            const res = await fetch(`/api/admin/posts?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setPosts(data.data || [])
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [search, statusFilter])

    const handleStatus = async (id: string, status: string) => {
        setActionLoading(id + status)
        const token = localStorage.getItem('accessToken')
        try {
            await fetch(`/api/admin/posts/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })
            setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
        } finally {
            setActionLoading(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa post này? Không thể hoàn tác!')) return
        setActionLoading(id + 'del')
        const token = localStorage.getItem('accessToken')
        try {
            await fetch(`/api/admin/posts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            setPosts(prev => prev.filter(p => p.id !== id))
        } finally {
            setActionLoading(null)
        }
    }

    const statusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400'
            case 'HIDDEN': return 'bg-yellow-500/20 text-yellow-400'
            case 'BLOCKED': return 'bg-red-500/20 text-red-400'
            default: return 'bg-gray-700 text-gray-400'
        }
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Kiểm duyệt Post</h1>
                <p className="text-gray-400 text-sm mt-1">{posts.length} bài viết</p>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm nội dung..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder:text-gray-600 outline-none focus:border-emerald-500 transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Active</option>
                    <option value="HIDDEN">Hidden</option>
                    <option value="BLOCKED">Blocked</option>
                </select>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">Không có bài viết nào</div>
                ) : posts.map((post) => (
                    <div key={post.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                        <div className="flex gap-4">
                            <img
                                src={post.author.avatar || `https://i.pravatar.cc/40?u=${post.author.id}`}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                alt={post.author.name}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                        <span className="font-semibold text-white text-sm">{post.author.name}</span>
                                        <span className="text-gray-500 text-xs ml-2">{post.author.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusBadge(post.status)}`}>
                                            {post.status}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-3">
                                    {post.content}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex gap-4 text-xs text-gray-500">
                                        <span>❤️ {post._count.likes}</span>
                                        <span>💬 {post._count.comments}</span>
                                        <span className="text-emerald-600">#{post.category}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {post.status !== 'ACTIVE' && (
                                            <button
                                                onClick={() => handleStatus(post.id, 'ACTIVE')}
                                                disabled={!!actionLoading}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Hiện
                                            </button>
                                        )}
                                        {post.status !== 'HIDDEN' && (
                                            <button
                                                onClick={() => handleStatus(post.id, 'HIDDEN')}
                                                disabled={!!actionLoading}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs font-medium transition-all"
                                            >
                                                <EyeOff className="w-3.5 h-3.5" /> Ẩn
                                            </button>
                                        )}
                                        {post.status !== 'BLOCKED' && (
                                            <button
                                                onClick={() => handleStatus(post.id, 'BLOCKED')}
                                                disabled={!!actionLoading}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
                                            >
                                                <ShieldAlert className="w-3.5 h-3.5" /> Khóa
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            disabled={!!actionLoading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}