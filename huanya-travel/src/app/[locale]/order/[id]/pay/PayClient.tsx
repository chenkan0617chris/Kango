'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { formatAUD } from '@/lib/utils'
import { CreditCard, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
  orderId: string
  depositAmount: number
}

export function PayClient({ orderId, depositAmount }: Props) {
  const t = useTranslations('order')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay_deposit' }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? t('payError'))
      } else {
        router.push(`/order/${orderId}`)
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
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-gray-500" />
          {t('payMethod')}
        </h2>
        <div className="space-y-3">
          <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-400 bg-gray-50 font-mono tracking-widest">
            4242 4242 4242 4242
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-400 bg-gray-50">
              12 / 28
            </div>
            <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-400 bg-gray-50">
              CVC
            </div>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Lock size={10} />
            {t('testMode')}
          </p>
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
