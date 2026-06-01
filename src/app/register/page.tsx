'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (session) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <img src="/yakflow.png" alt="YakFlow" className="size-10" />
          <h1 className="text-2xl font-bold text-emerald-600">YakFlow</h1>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
