'use client'

import { useEffect, useState } from 'react'
import { Link, useRouter, usePathname } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Car, ChevronDown, LogOut, Menu, X, UserCircle } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { Profile } from '@/types'

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [dropOpen, setDropOpen]   = useState(false)
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setProfile(null)
        setAuthReady(true)
        return
      }
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        .then(({ data }) => {
          setProfile(data)
          setAuthReady(true)
        })
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isDriver  = profile?.role === 'driver'
  const isTourist = profile?.role === 'tourist'
  const initial   = profile?.full_name?.[0]?.toUpperCase() ?? '?'

  const navLinks = isDriver
    ? [
        { href: '/driver/marketplace' as const, label: t('marketplace') },
        { href: '/driver/bids' as const,        label: t('myBids') },
      ]
    : isTourist
    ? [
        { href: '/demand/create' as const,     label: t('postDemand') },
        { href: '/tourist/dashboard' as const, label: t('myTrips') },
      ]
    : []

  const profileHref = isDriver ? `/profile/driver/${profile?.id}` : null

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
            <Car size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">
            {locale === 'zh' ? '环亚出行' : 'HuanYa Travel'}
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(l.href)
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {!authReady ? (
            <div className="hidden sm:block w-24 h-8 bg-gray-100 rounded-lg animate-pulse" />
          ) : profile ? (
            <div className="relative">
              <button
                onClick={() => setDropOpen(o => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
                  {initial}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-24 truncate">
                  {profile.full_name ?? profile.role}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-11 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 animate-fadeIn">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-900 truncate">{profile.full_name}</p>
                    <p className="text-xs text-gray-500">{isDriver ? t('verifiedDriver') : t('tourist')}</p>
                  </div>
                  {profileHref && (
                    <Link
                      href={profileHref as '/'}
                      onClick={() => setDropOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircle size={14} className="text-gray-400" />
                      {t('myCard')}
                    </Link>
                  )}
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                {t('login')}
              </Link>
              <Link href="/register" className="px-4 py-1.5 text-sm font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors">
                {t('register')}
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white py-3 px-4 space-y-1 animate-fadeIn">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {l.label}
            </Link>
          ))}
          {profile && profileHref && (
            <Link
              href={profileHref as '/'}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              {t('myCard')}
            </Link>
          )}
          {authReady && !profile && (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">{t('login')}</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-blue-900 hover:bg-blue-50 rounded-lg">{t('register')}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
