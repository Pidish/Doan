'use client'

import { useState, useEffect } from 'react'
import { Search, Shield, ShieldOff, Trash2, UserCheck, UserX, Loader2 } from 'lucide-react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface User {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
    isActive: boolean
    createdAt: string
    _count: { posts: number; followers: number }
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (roleFilter) params.append('role', roleFilter)

            const res = await fetchWithAuth(`/api/admin/users?${params}`)
            const data = await res.json()
            setUsers(data.data || [])
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [search, roleFilter])

    const handleToggleRole = async (user: User) => {
        setActionLoading(user.id)
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
        try {
            await fetchWithAuth(`/api/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            })
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, role: newRole } : u
            ))
        } finally {
            setActionLoading(null)
        }
    }

    const handleToggleBan = async (user: User) => {
        setActionLoading(user.id + 'ban')
        try {
            await fetchWithAuth(`/api/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !user.isActive })
            })
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, isActive: !u.isActive } : u
            ))
        } finally {
            setActionLoading(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa user này? Không thể hoàn tác!')) return
        setActionLoading(id + 'del')
        try {
            await fetchWithAuth(`/api/admin/users/${id}`, { method: 'DELETE' })
            setUsers(prev => prev.filter(u => u.id !== id))
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Quản lý User</h1>
                <p className="text-gray-400 text-sm mt-1">{users.length} người dùng</p>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm user..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder:text-gray-600 outline-none focus:border-emerald-500 transition-all"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500"
                >
                    <option value="">Tất cả role</option>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Posts</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                            <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                                </td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={user.avatar || `https://i.pravatar.cc/40?u=${user.id}`}
                                            className="w-9 h-9 rounded-full object-cover"
                                            alt={user.name}
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-white">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-gray-700 text-gray-400'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">{user._count.posts}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.isActive
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Toggle Role */}
                                        <button
                                            onClick={() => handleToggleRole(user)}
                                            disabled={actionLoading === user.id}
                                            title={user.role === 'ADMIN' ? 'Hạ xuống User' : 'Nâng lên Admin'}
                                            className="p-2 rounded-lg text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                                        >
                                            {actionLoading === user.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : user.role === 'ADMIN'
                                                    ? <ShieldOff className="w-4 h-4" />
                                                    : <Shield className="w-4 h-4" />
                                            }
                                        </button>

                                        {/* Ban/Unban */}
                                        <button
                                            onClick={() => handleToggleBan(user)}
                                            disabled={actionLoading === user.id + 'ban'}
                                            title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                                            className="p-2 rounded-lg text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all"
                                        >
                                            {actionLoading === user.id + 'ban'
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : user.isActive
                                                    ? <UserX className="w-4 h-4" />
                                                    : <UserCheck className="w-4 h-4" />
                                            }
                                        </button>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            disabled={actionLoading === user.id + 'del'}
                                            title="Xóa user"
                                            className="p-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                        >
                                            {actionLoading === user.id + 'del'
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Trash2 className="w-4 h-4" />
                                            }
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}