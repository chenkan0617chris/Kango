'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { MapPin, ArrowRight, Calendar, Users, TrendingUp, Info, Car, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Demand } from '@/types'

const PLATFORM_FEE_RATE = 0.10
const FUEL_COST_PER_KM  = 0.25

export interface DriverVehicle {
  vehicle_type: string
  vehicle_plate: string
}

interface BidModalProps {
  demand: Demand | null
  onClose: () => void
  onSuccess: (demandId: string) => void
  driverVehicles: DriverVehicle[]
}

export function BidModal({ demand, onClose, onSuccess, driverVehicles }: BidModalProps) {
  const locale = useLocale()
  const [price,           setPrice]           = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<DriverVehicle | null>(driverVehicles[0] ?? null)
  const [message,         setMessage]         = useState('')
  const [km,              setKm]              = useState('')
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')

  const calc = useMemo(() => {
    const p = parseFloat(price)
    if (!p || p <= 0) return null
    const platformFee = p * PLATFORM_FEE_RATE
    const fuelCost    = km ? parseFloat(km) * FUEL_COST_PER_KM : 0
    const netProfit   = p - platformFee - fuelCost
    return { platformFee, fuelCost, netProfit }
  }, [price, km])

  if (!demand) return null

  function fmt(n: number) { return `$${n.toFixed(0)}` }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!price || !selectedVehicle) return
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
          price:        priceNum,
          vehicle_info: `${selectedVehicle.vehicle_type} · ${selectedVehicle.vehicle_plate}`,
          message:      message || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '提交失败，请重试')
      } else {
        onSuccess(demand!.id)
        onClose()
        setPrice(''); setMessage(''); setKm('')
        setSelectedVehicle(driverVehicles[0] ?? null)
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
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">报价金额 (AUD) <span className="text-red-500">*</span></label>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="如：280"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
          />
          <p className="text-xs text-gray-400">请输入整数，单位澳元</p>
        </div>

        {/* Profit calculator */}
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
            <div className="flex items-center justify-between gap-4 text-sm text-gray-500">
              <label className="flex items-center gap-1 shrink-0">
                预计行驶
                <span className="text-xs text-gray-400 ml-0.5">(可选)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min="0" step="10" placeholder="0" value={km}
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

        {/* Vehicle selection cards */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">出行车辆 <span className="text-red-500">*</span></label>
          {driverVehicles.length === 0 ? (
            <p className="text-sm text-red-500">请先在车辆设置页填写车辆信息</p>
          ) : (
            <div className="grid gap-2">
              {driverVehicles.map((v, i) => {
                const selected = selectedVehicle?.vehicle_plate === v.vehicle_plate
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedVehicle(v)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? 'border-blue-900 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-blue-900' : 'bg-gray-100'}`}>
                      <Car size={16} className={selected ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {v.vehicle_type}
                      </p>
                      <p className={`text-xs mt-0.5 ${selected ? 'text-blue-600' : 'text-gray-400'}`}>
                        车牌：{v.vehicle_plate}
                      </p>
                    </div>
                    {selected && <CheckCircle size={18} className="text-blue-900 shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

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
          <Button type="submit" loading={loading} disabled={!selectedVehicle} className="flex-1">
            确认报价
          </Button>
        </div>
      </form>
    </Modal>
  )
}
