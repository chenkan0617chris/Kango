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

  async function handleGoogleSignIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

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
      router.push(role === 'driver' ? `/profile/driver/${data.user!.id}` : '/demand/create')
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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-400">{t('orContinueWith')}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
          <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        {t('signInWithGoogle')}
      </button>

      <p className="text-center text-xs text-gray-400 mt-2">{t('googleNote')}</p>

      <p className="text-center text-sm text-gray-500 mt-6">
        {t('alreadyHaveAccount')}{' '}
        <Link href="/login" className="text-blue-900 font-semibold hover:underline">
          {t('signInNow')}
        </Link>
      </p>
    </div>
  )
}
