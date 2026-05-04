'use client'

import { useState, useEffect } from 'react'
import { Loader2, TrendingUp, Award, Tag } from 'lucide-react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface Stats {
    totalUsers: number
    totalPosts: number
    totalComments: number
    totalLikes: number
    blockedPosts: number
    newUsersToday: number
    newPostsToday: number
    last7Days: { date: string; users: number }[]
}

export default function StatsPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetchWithAuth('/api/admin/stats')
                const data = await res.json()
                setStats(data)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const categoryData = [
        { name: 'Tĩnh lặng', value: 35, color: '#10b981' },
        { name: 'Sống xanh', value: 25, color: '#3b82f6' },
        { name: 'Sáng tạo', value: 20, color: '#f59e0b' },
        { name: 'Tâm lý học', value: 15, color: '#8b5cf6' },
        { name: 'Khác', value: 5, color: '#6b7280' },
    ]

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Thống kê</h1>
                <p className="text-gray-400 text-sm mt-1">Phân tích chi tiết hệ thống</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'User mới hôm nay', value: stats?.newUsersToday, color: 'text-emerald-400' },
                    { label: 'Post mới hôm nay', value: stats?.newPostsToday, color: 'text-blue-400' },
                    { label: 'Post bị khóa', value: stats?.blockedPosts, color: 'text-red-400' },
                    { label: 'Tổng lượt thích', value: stats?.totalLikes, color: 'text-rose-400' },
                ].map((item) => (
                    <div key={item.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                        <p className="text-gray-400 text-xs mb-2">{item.label}</p>
                        <p className={`text-3xl font-bold ${item.color}`}>{item.value?.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* User tăng trưởng */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        User mới 7 ngày
                    </h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={stats?.last7Days}>
                            <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                            <YAxis stroke="#6b7280" fontSize={11} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Category phân bổ */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-blue-400" />
                        Phân bổ Category
                    </h2>
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                            {categoryData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-gray-400 text-xs">{item.name}</span>
                                    </div>
                                    <span className="text-white text-xs font-bold">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Hoạt động */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 lg:col-span-2">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-400" />
                        Tổng quan hoạt động
                    </h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={[
                            { name: 'Users', value: stats?.totalUsers },
                            { name: 'Posts', value: stats?.totalPosts },
                            { name: 'Comments', value: stats?.totalComments },
                            { name: 'Likes', value: stats?.totalLikes },
                        ]}>
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                            />
                            <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}