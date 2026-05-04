'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/shared/Navbar'
import { LocationInput } from '@/components/shared/LocationInput'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MapPin, Calendar, Users, Luggage, DollarSign, FileText } from 'lucide-react'

export default function CreateDemandPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    pickup_loc:   '',
    dropoff_loc:  '',
    pickup_detail:'',
    travel_date:  '',
    travel_time:  '',
    pax_count:    '2',
    luggage_count:'1',
    budget_min:   '',
    budget_max:   '',
    note:         '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.pickup_loc || !form.dropoff_loc || !form.travel_date) {
      setError('请填写出发地、目的地和出行日期')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_loc:    form.pickup_loc,
          dropoff_loc:   form.dropoff_loc,
          pickup_detail: form.pickup_detail || undefined,
          travel_date:   form.travel_date,
          travel_time:   form.travel_time || undefined,
          pax_count:     parseInt(form.pax_count),
          luggage_count: parseInt(form.luggage_count),
          budget_min:    form.budget_min ? parseFloat(form.budget_min) : undefined,
          budget_max:    form.budget_max ? parseFloat(form.budget_max) : undefined,
          note:          form.note || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '发布失败，请重试')
      } else {
        router.push('/tourist/dashboard')
        router.refresh()
      }
    } catch {
      setError('网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">发布行程需求</h1>
          <p className="text-sm text-gray-500 mt-1">填写行程信息，多位司机将主动向您报价</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Route */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={16} className="text-blue-900" /> 行程路线
            </h2>
            <LocationInput
              label="出发地"
              value={form.pickup_loc}
              onChange={v => set('pickup_loc', v)}
              placeholder="如：Melbourne Airport (MEL)"
              required
            />
            <LocationInput
              label="目的地"
              value={form.dropoff_loc}
              onChange={v => set('dropoff_loc', v)}
              placeholder="如：Great Ocean Road, VIC"
              required
            />
            <Input
              label="详细上车地点（可选）"
              type="text"
              placeholder="如：T2 国际出发 3 号门外"
              value={form.pickup_detail}
              onChange={e => set('pickup_detail', e.target.value)}
            />
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-blue-900" /> 出行时间
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="出行日期"
                type="date"
                min={today}
                value={form.travel_date}
                onChange={e => set('travel_date', e.target.value)}
                required
              />
              <Input
                label="上车时间（可选）"
                type="time"
                value={form.travel_time}
                onChange={e => set('travel_time', e.target.value)}
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={16} className="text-blue-900" /> 人员 & 行李
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="乘客人数"
                type="number"
                min="1"
                max="20"
                value={form.pax_count}
                onChange={e => set('pax_count', e.target.value)}
                required
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Luggage size={13} className="text-gray-400" />行李数量
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={form.luggage_count}
                  onChange={e => set('luggage_count', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign size={16} className="text-blue-900" /> 预算范围（可选）
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="最低预算 (AUD)"
                type="number"
                min="0"
                placeholder="如：150"
                value={form.budget_min}
                onChange={e => set('budget_min', e.target.value)}
                hint="单位：澳元"
              />
              <Input
                label="最高预算 (AUD)"
                type="number"
                min="0"
                placeholder="如：350"
                value={form.budget_max}
                onChange={e => set('budget_max', e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <FileText size={16} className="text-blue-900" /> 特殊需求（可选）
            </h2>
            <Textarea
              placeholder="如：需要儿童安全座椅、司机会普通话、行程中要停一个景点拍照等"
              value={form.note}
              onChange={e => set('note', e.target.value)}
            />
          </div>

          {/* Submit */}
          <Button type="submit" loading={loading} size="lg" className="w-full">
            发布行程需求
          </Button>

          <p className="text-center text-xs text-gray-400">
            发布后司机将在 24 小时内报价，行程确认前无需支付任何费用
          </p>
        </form>
      </main>
    </div>
  )
}
