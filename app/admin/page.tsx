'use client'

import { useState, useEffect } from 'react'
import {
    Users, FileText, Heart, MessageCircle,
    TrendingUp, ShieldAlert, UserCheck, Activity,
    ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, LineChart, Line,
    AreaChart, Area, CartesianGrid
} from 'recharts'

interface Stats {
    totalUsers: number
    totalPosts: number
    totalComments: number
    totalLikes: number
    blockedPosts: number
    adminUsers: number
    newUsersToday: number
    newPostsToday: number
    last7Days: { date: string; users: number; posts: number }[]
}

interface RecentActivity {
    id: string
    type: 'user' | 'post' | 'comment'
    message: string
    time: string
    avatar?: string
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [recentUsers, setRecentUsers] = useState<any[]>([])
    const [recentPosts, setRecentPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAll = async () => {
            const token = localStorage.getItem('accessToken')
            try {
                const [statsRes, usersRes, postsRes] = await Promise.all([
                    fetch('/api/admin/stats', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch('/api/admin/users?limit=5', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch('/api/admin/posts?limit=5', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                ])

                const [statsData, usersData, postsData] = await Promise.all([
                    statsRes.json(),
                    usersRes.json(),
                    postsRes.json(),
                ])

                setStats(statsData)
                setRecentUsers(usersData.data?.slice(0, 5) || [])
                setRecentPosts(postsData.data?.slice(0, 5) || [])
            } catch (err) {
                console.error('Error:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    const statCards = [
        {
            label: 'Tổng Users',
            value: stats?.totalUsers,
            sub: `+${stats?.newUsersToday} hôm nay`,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            trend: 'up'
        },
        {
            label: 'Tổng Posts',
            value: stats?.totalPosts,
            sub: `+${stats?.newPostsToday} hôm nay`,
            icon: FileText,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            trend: 'up'
        },
        {
            label: 'Tổng Likes',
            value: stats?.totalLikes,
            sub: 'Tổng lượt thích',
            icon: Heart,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            trend: 'up'
        },
        {
            label: 'Bình luận',
            value: stats?.totalComments,
            sub: 'Tổng bình luận',
            icon: MessageCircle,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            trend: 'up'
        },
        {
            label: 'Post bị khóa',
            value: stats?.blockedPosts,
            sub: 'Cần xem xét',
            icon: ShieldAlert,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            trend: 'down'
        },
        {
            label: 'Quản trị viên',
            value: stats?.adminUsers,
            sub: 'Tài khoản Admin',
            icon: UserCheck,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            trend: 'up'
        },
    ]

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime()
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)
        if (mins < 60) return `${mins} phút trước`
        if (hours < 24) return `${hours} giờ trước`
        return `${days} ngày trước`
    }

    const statusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400'
            case 'HIDDEN': return 'bg-yellow-500/20 text-yellow-400'
            case 'BLOCKED': return 'bg-red-500/20 text-red-400'
            default: return 'bg-gray-700 text-gray-400'
        }
    }

    return (
        <div className="p-8 space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {new Date().toLocaleDateString('vi-VN', {
                            weekday: 'long', year: 'numeric',
                            month: 'long', day: 'numeric'
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-medium">Hệ thống hoạt động bình thường</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className={`bg-gray-900 rounded-2xl p-5 border ${card.border}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                            {card.trend === 'up' ? (
                                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4 text-red-400" />
                            )}
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                            {card.value?.toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-xs">{card.label}</p>
                        <p className={`text-xs mt-1 ${card.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {card.sub}
                        </p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* User tăng trưởng */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">User tăng trưởng</h2>
                        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">7 ngày qua</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={stats?.last7Days}>
                            <defs>
                                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                            <YAxis stroke="#6b7280" fontSize={11} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#111827',
                                    border: '1px solid #1f2937',
                                    borderRadius: '12px',
                                    color: '#fff'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="users"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#userGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Post tăng trưởng */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">Post tăng trưởng</h2>
                        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">7 ngày qua</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats?.last7Days}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                            <YAxis stroke="#6b7280" fontSize={11} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#111827',
                                    border: '1px solid #1f2937',
                                    borderRadius: '12px',
                                    color: '#fff'
                                }}
                            />
                            <Bar dataKey="posts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Users */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                        <h2 className="font-bold text-white">User mới nhất</h2>
                        <a href="/admin/users" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                            Xem tất cả <ArrowUpRight className="w-3 h-3" />
                        </a>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 px-6 py-3">
                                <img
                                    src={user.avatar || `https://i.pravatar.cc/36?u=${user.id}`}
                                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                    alt={user.name}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'ADMIN'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-gray-700 text-gray-400'
                                        }`}>
                                        {user.role}
                                    </span>
                                    <span className="text-xs text-gray-600">{timeAgo(user.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Posts */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                        <h2 className="font-bold text-white">Post mới nhất</h2>
                        <a href="/admin/posts" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                            Xem tất cả <ArrowUpRight className="w-3 h-3" />
                        </a>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {recentPosts.map((post) => (
                            <div key={post.id} className="flex items-start gap-3 px-6 py-3">
                                <img
                                    src={post.author.avatar || `https://i.pravatar.cc/36?u=${post.author.id}`}
                                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
                                    alt={post.author.name}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="text-sm font-medium text-white truncate">{post.author.name}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor(post.status)}`}>
                                            {post.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-2">{post.content}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                        <span>❤️ {post._count.likes}</span>
                                        <span>💬 {post._count.comments}</span>
                                        <span>{timeAgo(post.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}