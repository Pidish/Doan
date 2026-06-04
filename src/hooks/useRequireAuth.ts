'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useRequireAuth() {
  const router = useRouter()
  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.replace('/explore')
    }
  }, [router])
}
