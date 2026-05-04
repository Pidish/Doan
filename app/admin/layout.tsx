'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard, Users, FileText,
    LogOut, Shield, BarChart3, ChevronRight
} from 'lucide-react'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (!token) { router.push('/login'); return }

        fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(async res => {
                if (res.status === 401) {
                    // try refresh
                    const refreshToken = localStorage.getItem('refreshToken')
                    if (!refreshToken) { router.push('/login'); return }
                    const rr = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken }),
                    })
                    if (!rr.ok) { router.push('/login'); return }
                    const { accessToken } = await rr.json()
                    localStorage.setItem('accessToken', accessToken)
                    return fetch('/api/me', { headers: { Authorization: `Bearer ${accessToken}` } })
                }
                return res
            })
            .then(res => res?.json())
            .then(data => {
                if (!data?.data) { router.push('/login'); return }
                if (data.data.role !== 'ADMIN') { router.push('/home'); return }
                setAdmin(data.data)
                setLoading(false)
            })
            .catch(() => router.push('/login'))
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        router.push('/login')
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Quản lý User', path: '/admin/users' },
        { icon: FileText, label: 'Kiểm duyệt Post', path: '/admin/posts' },
        { icon: BarChart3, label: 'Thống kê', path: '/admin/stats' },
    ]

    if (loading) return null

    return (
        <div className="flex h-screen bg-gray-950 text-white">

            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-black text-white italic text-lg">Nexora</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-emerald-600 text-white font-semibold'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-sm">{item.label}</span>
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                        )
                    })}
                </nav>

                {/* Admin info */}
                <div className="p-4 border-t border-gray-800">
                    {admin && (
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-9 h-9 bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-emerald-300">
                                    {admin.name?.[0]?.toUpperCase()}
                                </span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate">{admin.name}</p>
                                <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Link
                            href="/home"
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all text-sm"
                        >
                            Về trang chủ
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-y-auto bg-gray-950">
                {children}
            </main>
        </div>
    )
}