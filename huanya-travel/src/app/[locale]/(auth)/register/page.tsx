'use client'

import { useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Users, Car } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { UserRole } from '@/types'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [role, setRole]           = useState<UserRole>('tourist')
  const [error, setError]         = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading]     = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError(t('passwordTooShort')); return }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user && !data.session) {
      setError('')
      setLoading(false)
      setSuccessMsg(t('confirmEmail'))
    } else {
      router.push(role === 'driver' ? '/driver/marketplace' : '/demand/create')
      router.refresh()
    }
  }

  if (successMsg) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{t('registerTitle')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('registerSub')}</p>
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-4 rounded-xl leading-relaxed">
          {successMsg}
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-blue-900 font-semibold hover:underline">
            {t('signInNow')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">{t('registerTitle')}</h2>
      <p className="text-sm text-gray-500 mb-6">{t('registerSub')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Role selector */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{t('iAm')}</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'tourist', label: t('tourist'), icon: Users, desc: t('touristDesc') },
              { value: 'driver',  label: t('driver'),  icon: Car,   desc: t('driverDesc') },
            ] as const).map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={[
                  'flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all',
                  role === value
                    ? 'border-blue-900 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                ].join(' ')}
              >
                <Icon size={20} className={role === value ? 'text-blue-900' : 'text-gray-400'} />
                <span className={`text-sm font-semibold ${role === value ? 'text-blue-900' : 'text-gray-700'}`}>
                  {label}
                </span>
                <span className="text-xs text-gray-400">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label={t('name')}
          type="text"
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

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
          placeholder={t('passwordPlaceholder')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {t('registerBtn')}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        {t('alreadyHaveAccount')}{' '}
        <Link href="/login" className="text-blue-900 font-semibold hover:underline">
          {t('signInNow')}
        </Link>
      </p>
    </div>
  )
}
