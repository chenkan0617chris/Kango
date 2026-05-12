'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Car, CheckCircle } from 'lucide-react'

const COLORS = ['白色', '银色', '黑色', '灰色', '蓝色', '红色', '其他']
const SEATS  = [5, 6, 7, 8, 9, 11, 12, 13, 14]

export default function VehicleSetupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [model,   setModel]   = useState('')
  const [plate,   setPlate]   = useState('')
  const [color,   setColor]   = useState('白色')
  const [seats,   setSeats]   = useState(7)
  const [year,    setYear]    = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!model.trim() || !plate.trim()) return
    setLoading(true)
    setError('')

    const vehicleType = `${model.trim()} ${year} ${color} ${seats}座`

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase
      .from('profiles')
      .update({ vehicle_type: vehicleType, vehicle_plate: plate.trim().toUpperCase() })
      .eq('id', user.id)

    if (err) {
      setError('保存失败，请重试')
      setLoading(false)
      return
    }

    router.push('/driver/marketplace')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Car size={20} className="text-blue-900" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">完善车辆信息</h1>
            <p className="text-xs text-gray-500">填写后方可在接单大厅报价</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-lg">{error}</div>
          )}

          <Input
            label="车辆品牌 / 型号"
            type="text"
            placeholder="如：Toyota Alphard、Mercedes V-Class"
            value={model}
            onChange={e => setModel(e.target.value)}
            required
          />

          <Input
            label="车牌号"
            type="text"
            placeholder="如：1ABC234"
            value={plate}
            onChange={e => setPlate(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">出厂年份</label>
            <input
              type="number"
              min="2000"
              max={new Date().getFullYear()}
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">颜色</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    color === c
                      ? 'border-blue-900 bg-blue-50 text-blue-900 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">座位数</label>
            <div className="flex flex-wrap gap-2">
              {SEATS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeats(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    seats === s
                      ? 'border-blue-900 bg-blue-50 text-blue-900 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s}座
                </button>
              ))}
            </div>
          </div>

          {model && plate && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
              <CheckCircle size={16} className="shrink-0 text-blue-600" />
              <span>{model.trim()} {year} {color} {seats}座 · {plate.trim().toUpperCase()}</span>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            保存并开始接单
          </Button>
        </form>
      </div>
    </div>
  )
}
