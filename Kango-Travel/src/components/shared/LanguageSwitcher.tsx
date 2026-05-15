'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useTransition } from 'react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = locale === 'en' ? 'zh' : 'en'
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
    >
      {locale === 'en' ? '中文' : 'EN'}
    </button>
  )
}
