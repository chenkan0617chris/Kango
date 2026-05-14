'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Car, Pencil, CheckCircle, Minus, Plus } from 'lucide-react'

const VEHICLE_MODELS: Record<string, string[]> = {
  'Toyota':        ['HiAce', 'Alphard', 'LandCruiser 200', 'LandCruiser 300', 'Prado', 'Tarago', 'Kluger', 'RAV4', 'Hiace Commuter'],
  'Mercedes-Benz': ['V-Class', 'Sprinter', 'GLS', 'Viano'],
  'Hyundai':       ['iMax', 'Staria', 'Santa Fe', 'Tucson'],
  'Kia':           ['Carnival', 'Sorento', 'Telluride'],
  'Ford':          ['Transit', 'Everest', 'Explorer'],
  'Volkswagen':    ['Transporter', 'Caravelle', 'Multivan'],
  'Lexus':         ['LX 570', 'LX 600', 'GX 460', 'RX 350', 'LM 350'],
  'BMW':           ['X7', 'X5', '7 Series'],
  'Audi':          ['Q7', 'Q8', 'A8'],
  'Cadillac':      ['Escalade'],
  'Chevrolet':     ['Express'],
  'Land Rover':    ['Defender', 'Discovery', 'Range Rover', 'Range Rover Sport'],
  'Hongqi':        ['H9', 'HS7'],
  'BYD':           ['Han', 'Tang', 'D9'],
}

const BRANDS = Object.keys(VEHICLE_MODELS)

const COLORS: { key: string; labelKey: string }[] = [
  { key: '白色', labelKey: 'colorWhite' },
  { key: '银色', labelKey: 'colorSilver' },
  { key: '黑色', labelKey: 'colorBlack' },
  { key: '灰色', labelKey: 'colorGrey' },
  { key: '蓝色', labelKey: 'colorBlue' },
  { key: '红色', labelKey: 'colorRed' },
  { key: '其他', labelKey: 'colorOther' },
]

const CUR_YEAR = new Date().getFullYear()

function parseVehicleType(vt: string | null) {
  if (!vt) return { brand: '', modelName: '', year: CUR_YEAR.toString(), color: '白色', seats: 7 }
  const parts = vt.split(' ')
  const seatsIdx = parts.findLastIndex((p: string) => p.endsWith('座'))
  if (seatsIdx < 3) return { brand: '', modelName: vt, year: CUR_YEAR.toString(), color: '白色', seats: 7 }

  const beforeSeats = parts.slice(0, seatsIdx - 2)
  let brand = ''
  let modelName = ''
  for (const b of BRANDS) {
    const bParts = b.split(' ')
    if (beforeSeats.slice(0, bParts.length).join(' ') === b) {
      brand = b
      modelName = beforeSeats.slice(bParts.length).join(' ')
      break
    }
  }
  if (!brand && beforeSeats.length > 0) {
    brand = beforeSeats[0]
    modelName = beforeSeats.slice(1).join(' ')
  }

  return {
    brand,
    modelName,
    year:  parts[seatsIdx - 2] ?? CUR_YEAR.toString(),
    color: parts[seatsIdx - 1] ?? '白色',
    seats: parseInt(parts[seatsIdx]) || 7,
  }
}

interface Props {
  driverId: string
  initialVehicleType: string | null
  initialPlate: string | null
}

export function VehicleEditForm({ driverId, initialVehicleType, initialPlate }: Props) {
  const t      = useTranslations('vehicle')
  const router = useRouter()
  const supabase = createClient()

  const parsed = parseVehicleType(initialVehicleType)
  const [editing, setEditing]     = useState(!initialVehicleType)
  const [brand, setBrand]         = useState(parsed.brand)
  const [modelName, setModelName] = useState(parsed.modelName)
  const [year, setYear]           = useState(parsed.year)
  const [color, setColor]         = useState(parsed.color)
  const [seats, setSeats]         = useState(parsed.seats)
  const [plate, setPlate]         = useState(initialPlate ?? '')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const models = brand && VEHICLE_MODELS[brand] ? VEHICLE_MODELS[brand] : []

  async function handleSave() {
    if (!brand.trim() || !modelName.trim() || !plate.trim()) return
    setLoading(true)
    setError('')
    const vehicleType = `${brand.trim()} ${modelName.trim()} ${year} ${color} ${seats}座`
    const { error: err } = await supabase
      .from('profiles')
      .update({ vehicle_type: vehicleType, vehicle_plate: plate.trim().toUpperCase() })
      .eq('id', driverId)
    if (err) {
      setError(t('saveError'))
      setLoading(false)
      return
    }
    setEditing(false)
    setLoading(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        {initialVehicleType && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{t('vehicleTypeDisplay')}</span>
            <span className="font-medium text-gray-900">{initialVehicleType}</span>
          </div>
        )}
        {initialPlate && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{t('plateDisplay')}</span>
            <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {initialPlate}
            </span>
          </div>
        )}
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 mt-1"
        >
          <Pencil size={12} /> {t('editBtn')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!initialVehicleType && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          {t('incompleteWarning')}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Brand chips */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('brandLabel')} <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {BRANDS.map(b => (
            <button
              key={b}
              type="button"
              onClick={() => { setBrand(b); setModelName('') }}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                brand === b
                  ? 'border-blue-900 bg-blue-50 text-blue-900 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Model */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {t('modelLabel')} <span className="text-red-500">*</span>
        </label>
        <input
          list="model-suggestions"
          type="text"
          placeholder={models[0] ?? 'e.g. Alphard, HiAce'}
          value={modelName}
          onChange={e => setModelName(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
        />
        <datalist id="model-suggestions">
          {models.map(m => <option key={m} value={m} />)}
        </datalist>
      </div>

      {/* Year */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{t('yearLabel')}</label>
        <input
          type="number"
          min="2000"
          max={CUR_YEAR}
          value={year}
          onChange={e => setYear(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
        />
      </div>

      {/* Color */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{t('colorLabel')}</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => setColor(c.key)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                color === c.key
                  ? 'border-blue-900 bg-blue-50 text-blue-900 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Seats stepper */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{t('seatsLabel')}</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSeats(s => Math.max(2, s - 1))}
            className="w-9 h-9 rounded-xl border border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-900 hover:text-blue-900 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="text-xl font-bold text-gray-900 w-8 text-center">{seats}</span>
          <button
            type="button"
            onClick={() => setSeats(s => Math.min(20, s + 1))}
            className="w-9 h-9 rounded-xl border border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-900 hover:text-blue-900 transition-colors"
          >
            <Plus size={14} />
          </button>
          <span className="text-sm text-gray-500">{t('seatUnit')}</span>
        </div>
      </div>

      {/* Plate */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {t('plateLabel')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. 1ABC234"
          value={plate}
          onChange={e => setPlate(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
        />
      </div>

      {/* Preview */}
      {brand && modelName && plate && (
        <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
          <CheckCircle size={15} className="shrink-0 text-blue-600" />
          <span>{brand.trim()} {modelName.trim()} {year} {color} {seats}座 · {plate.trim().toUpperCase()}</span>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        {initialVehicleType && (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)} className="flex-1">
            {t('cancelBtn')}
          </Button>
        )}
        <Button
          type="button"
          loading={loading}
          disabled={!brand.trim() || !modelName.trim() || !plate.trim()}
          onClick={handleSave}
          className="flex-1"
        >
          <Car size={15} />
          {t('saveBtn')}
        </Button>
      </div>
    </div>
  )
}
