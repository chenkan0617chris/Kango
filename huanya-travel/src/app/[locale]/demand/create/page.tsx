'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Navbar } from '@/components/shared/Navbar'
import { LocationInput } from '@/components/shared/LocationInput'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MapPin, Calendar, Users, Luggage, DollarSign, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function CreateDemandPage() {
  const t = useTranslations('demand')
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
      setError(t('requiredFields'))
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
        setError(json.error ?? t('submitError'))
      } else {
        router.push('/tourist/dashboard')
        router.refresh()
      }
    } catch {
      setError(t('networkError'))
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
          <h1 className="text-2xl font-bold text-gray-900">{t('createTitle')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('createSub')}</p>
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
              <MapPin size={16} className="text-blue-900" /> {t('routeSection')}
            </h2>
            <LocationInput
              label={t('pickup')}
              value={form.pickup_loc}
              onChange={v => set('pickup_loc', v)}
              placeholder={t('pickupPlaceholder')}
              required
            />
            <LocationInput
              label={t('dropoff')}
              value={form.dropoff_loc}
              onChange={v => set('dropoff_loc', v)}
              placeholder={t('dropoffPlaceholder')}
              required
            />
            <Input
              label={t('pickupDetail')}
              type="text"
              placeholder={t('pickupDetailPlaceholder')}
              value={form.pickup_detail}
              onChange={e => set('pickup_detail', e.target.value)}
            />
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-blue-900" /> {t('dateSection')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('date')}
                type="date"
                min={today}
                value={form.travel_date}
                onChange={e => set('travel_date', e.target.value)}
                required
              />
              <Input
                label={t('time')}
                type="time"
                value={form.travel_time}
                onChange={e => set('travel_time', e.target.value)}
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={16} className="text-blue-900" /> {t('passengersSection')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('pax')}
                type="number"
                min="1"
                max="20"
                value={form.pax_count}
                onChange={e => set('pax_count', e.target.value)}
                required
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Luggage size={13} className="text-gray-400" />{t('luggage')}
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
              <DollarSign size={16} className="text-blue-900" /> {t('budgetSection')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('budgetMin')}
                type="number"
                min="0"
                placeholder={t('budgetMinPlaceholder')}
                value={form.budget_min}
                onChange={e => set('budget_min', e.target.value)}
                hint={t('budgetHint')}
              />
              <Input
                label={t('budgetMax')}
                type="number"
                min="0"
                placeholder={t('budgetMaxPlaceholder')}
                value={form.budget_max}
                onChange={e => set('budget_max', e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <FileText size={16} className="text-blue-900" /> {t('notesSection')}
            </h2>
            <Textarea
              placeholder={t('notesPlaceholder')}
              value={form.note}
              onChange={e => set('note', e.target.value)}
            />
          </div>

          {/* Submit */}
          <Button type="submit" loading={loading} size="lg" className="w-full">
            {t('submitBtn')}
          </Button>

          <p className="text-center text-xs text-gray-400">
            {t('submitNote')}
          </p>
        </form>
      </main>
    </div>
  )
}
