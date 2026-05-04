'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatAUD } from '@/lib/utils'
import { CreditCard, Lock } from 'lucide-react'

interface Props {
  orderId: string
  depositAmount: number
}

export function PayClient({ orderId, depositAmount }: Props) {
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
        setError(json.error ?? '支付失败，请重试')
      } else {
        router.push(`/order/${orderId}`)
      }
    } catch {
      setError('网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Simulated card form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-gray-500" />
          支付方式（模拟）
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
            测试模式 · 不会产生真实扣款
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <Button size="lg" className="w-full" loading={loading} onClick={handlePay}>
        确认支付 {formatAUD(depositAmount)} 定金
      </Button>

      <p className="text-center text-xs text-gray-400 mt-3">
        点击即表示同意平台服务条款，定金在行程完成后结算给司机
      </p>
    </div>
  )
}
