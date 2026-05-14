'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { formatAUD } from '@/lib/utils'
import { Lock, CreditCard } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
  orderId: string
  depositAmount: number
}

export function PayClient({ orderId, depositAmount }: Props) {
  const t = useTranslations('order')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? t('payError'))
      } else {
        window.location.href = json.url
      }
    } catch {
      setError(t('networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CreditCard size={16} className="text-gray-500" />
          {t('payMethod')}
        </h2>
        <p className="text-sm text-gray-500">{t('stripeNote')}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Lock size={11} />
          {t('stripeSecurity')}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <Button size="lg" className="w-full" loading={loading} onClick={handlePay}>
        {t('payBtn', { amount: formatAUD(depositAmount) })}
      </Button>

      <p className="text-center text-xs text-gray-400 mt-3">
        {t('payDisclaimer')}
      </p>
    </div>
  )
}
