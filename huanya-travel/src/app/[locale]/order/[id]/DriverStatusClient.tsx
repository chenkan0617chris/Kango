'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'

interface Props {
  orderId: string
  tripStatus: string
}

export function DriverStatusClient({ orderId, tripStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function updateStatus(nextStatus: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_trip_status', trip_status: nextStatus }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? '操作失败，请重试')
      } else {
        router.refresh()
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (tripStatus === 'completed') {
    return (
      <div className="flex items-center gap-2 justify-center bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 font-medium text-sm">
        <CheckCircle size={16} className="shrink-0" />
        行程已完成
      </div>
    )
  }

  if (tripStatus === 'confirmed') {
    return (
      <div className="space-y-2">
        {error && (
          <p className="text-xs text-red-600 text-center">{error}</p>
        )}
        <Button
          className="w-full"
          loading={loading}
          onClick={() => updateStatus('in_progress')}
        >
          开始行程
        </Button>
      </div>
    )
  }

  if (tripStatus === 'in_progress') {
    return (
      <div className="space-y-2">
        {error && (
          <p className="text-xs text-red-600 text-center">{error}</p>
        )}
        <Button
          className="w-full"
          loading={loading}
          onClick={() => updateStatus('completed')}
        >
          完成行程
        </Button>
      </div>
    )
  }

  return null
}
