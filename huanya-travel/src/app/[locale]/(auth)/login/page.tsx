'use client'

import { useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations('auth')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? t('invalidCredentials')
        : error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">{t('loginTitle')}</h2>
      <p className="text-sm text-gray-500 mb-6">{t('loginSub')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <Input
          label={t('email')}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <Input
          label={t('password')}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {t('loginBtn')}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-blue-900 font-semibold hover:underline">
          {t('registerNow')}
        </Link>
      </p>
    </div>
  )
}
