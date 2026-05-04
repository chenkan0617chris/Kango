'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Car, ChevronDown, LogOut, Menu, X, UserCircle } from 'lucide-react'
import type { Profile } from '@/types'

export function Navbar() {
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  const isDriver  = profile?.role === 'driver'
  const isTourist = profile?.role === 'tourist'
  const initial   = profile?.full_name?.[0]?.toUpperCase() ?? '?'

  const navLinks = isDriver
    ? [{ href: '/driver/marketplace', label: '接单大厅' }]
    : isTourist
    ? [
        { href: '/demand/create',     label: '发布需求' },
        { href: '/tourist/dashboard', label: '我的行程' },
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
          <span className="font-bold text-gray-900 text-lg tracking-tight">环亚出行</span>
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
          {profile ? (
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
                    <p className="text-xs text-gray-500">{isDriver ? '认证司机' : '游客'}</p>
                  </div>
                  {profileHref && (
                    <Link
                      href={profileHref}
                      onClick={() => setDropOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircle size={14} className="text-gray-400" />
                      我的名片
                    </Link>
                  )}
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                登录
              </Link>
              <Link href="/register" className="px-4 py-1.5 text-sm font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors">
                注册
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
              href={profileHref}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              我的名片
            </Link>
          )}
          {!profile && (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">登录</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-blue-900 hover:bg-blue-50 rounded-lg">注册</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
