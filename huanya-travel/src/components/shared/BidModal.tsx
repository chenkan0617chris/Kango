'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { MapPin, ArrowRight, Calendar, Users, TrendingUp, Info } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Demand } from '@/types'

const PLATFORM_FEE_RATE = 0.10   // 10%
const FUEL_COST_PER_KM  = 0.25   // AUD ~$0.25/km (fuel + wear estimate)

interface BidModalProps {
  demand: Demand | null
  onClose: () => void
  onSuccess: (demandId: string) => void
}

export function BidModal({ demand, onClose, onSuccess }: BidModalProps) {
  const locale = useLocale()
  const [price,   setPrice]   = useState('')
  const [vehicle, setVehicle] = useState('')
  const [message, setMessage] = useState('')
  const [km,      setKm]      = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const calc = useMemo(() => {
    const p = parseFloat(price)
    if (!p || p <= 0) return null
    const platformFee = p * PLATFORM_FEE_RATE
    const fuelCost    = km ? parseFloat(km) * FUEL_COST_PER_KM : 0
    const netProfit   = p - platformFee - fuelCost
    return { platformFee, fuelCost, netProfit }
  }, [price, km])

  if (!demand) return null

  function fmt(n: number) {
    return `$${n.toFixed(0)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!price || !vehicle) return
    setLoading(true)
    setError('')

    const priceNum = parseFloat(price)
    if (demand!.budget_min && priceNum * 100 < demand!.budget_min) {
      setError(`报价不得低于游客最低预算 $${Math.round(demand!.budget_min / 100)} AUD`)
      setLoading(false)
      return
    }
    if (demand!.budget_max && priceNum * 100 > demand!.budget_max) {
      setError(`报价不得高于游客最高预算 $${Math.round(demand!.budget_max / 100)} AUD`)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demand_id:    demand!.id,
          price:        parseFloat(price),
          vehicle_info: vehicle,
          message:      message || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '提交失败，请重试')
      } else {
        onSuccess(demand!.id)
        onClose()
        setPrice(''); setVehicle(''); setMessage(''); setKm('')
      }
    } catch {
      setError('网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={!!demand} onClose={onClose} title="提交报价" maxWidth="md">
      {/* Trip summary */}
      <div className="bg-blue-50 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-2 flex-wrap">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-none">{demand.pickup_loc}</span>
          <ArrowRight size={13} className="shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-none">{demand.dropoff_loc}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-700">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(demand.travel_date, locale)}
            {demand.travel_time && ` · ${demand.travel_time.slice(0, 5)}`}
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {demand.pax_count} 人 · {demand.luggage_count} 件行李
          </span>
        </div>
        {demand.budget_min && demand.budget_max && (
          <p className="text-xs text-blue-600 mt-1.5">
            游客预算：${demand.budget_min / 100} – ${demand.budget_max / 100} AUD
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-lg">{error}</div>
        )}

        {/* Price input */}
        <Input
          label="报价金额 (AUD)"
          type="number"
          min="1"
          step="1"
          placeholder="如：280"
          value={price}
          onChange={e => setPrice(e.target.value)}
          required
          hint="请输入整数，单位澳元"
        />

        {/* Profit calculator — appears once price is entered */}
        {calc && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              <TrendingUp size={12} />
              预计收益计算
            </div>

            <div className="flex justify-between text-sm text-gray-700">
              <span>总报价</span>
              <span className="font-medium">{fmt(parseFloat(price))}</span>
            </div>

            <div className="flex justify-between text-sm text-gray-500">
              <span>平台服务费 (10%)</span>
              <span className="text-red-500">－{fmt(calc.platformFee)}</span>
            </div>

            {/* Fuel input inline */}
            <div className="flex items-center justify-between gap-4 text-sm text-gray-500">
              <label className="flex items-center gap-1 shrink-0">
                预计行驶
                <span className="text-xs text-gray-400 ml-0.5">(可选)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="0"
                  value={km}
                  onChange={e => setKm(e.target.value)}
                  className="w-16 text-right border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
                <span className="text-gray-400 text-xs shrink-0">km</span>
                {calc.fuelCost > 0 && (
                  <span className="text-red-500 text-xs shrink-0">－{fmt(calc.fuelCost)}</span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">预计纯利</span>
              <span className={`text-base font-bold ${calc.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {fmt(calc.netProfit)}
              </span>
            </div>

            <p className="text-[11px] text-gray-400 flex items-start gap-1">
              <Info size={10} className="shrink-0 mt-0.5" />
              油费按 $0.25/km 估算（含车耗），实际以出行为准
            </p>
          </div>
        )}

        <Input
          label="车辆信息"
          type="text"
          placeholder="如：Toyota Alphard 7座，2023年，黑色"
          value={vehicle}
          onChange={e => setVehicle(e.target.value)}
          required
        />

        <Textarea
          label="补充说明（可选）"
          placeholder="可说明您的服务优势、包含费用等"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            确认报价
          </Button>
        </div>
      </form>
    </Modal>
  )
}
