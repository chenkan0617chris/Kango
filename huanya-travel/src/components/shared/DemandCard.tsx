'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Calendar, Users, Luggage, DollarSign, Star, Clock, Timer } from 'lucide-react'
import { DemandStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TripRoute } from '@/components/shared/TripRoute'
import { formatDate, formatAUD, formatRelativeTime } from '@/lib/utils'
import type { Demand } from '@/types'

interface DemandCardProps {
  demand: Demand
  mode: 'tourist' | 'driver'
  onBid?: (demand: Demand) => void
  bidCount?: number
  href?: string
  alreadyBid?: boolean
  amount?: number   // AUD cents — shown prominently for confirmed/in_progress trips
}

export function DemandCard({ demand, mode, onBid, bidCount = 0, href, alreadyBid = false, amount }: DemandCardProps) {
  const locale = useLocale()
  const t = useTranslations('demandCard')
  const tDash = useTranslations('dashboard')
  const router = useRouter()
  const canBid = mode === 'driver' && demand.status === 'pending'

  function handleCardClick() {
    if (href) router.push(href)
  }

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200 ${href ? 'cursor-pointer' : ''}`}
    >
      {/* Header: route timeline + status badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <TripRoute
          pickup={demand.pickup_loc}
          dropoff={demand.dropoff_loc}
          waypoints={demand.waypoints}
          returnLoc={demand.return_loc}
          size="sm"
        />
        <div className="flex flex-col items-end gap-1 shrink-0">
          <DemandStatusBadge status={demand.status} mode={mode} alreadyBid={alreadyBid} />
          {amount != null && mode === 'tourist' && ['confirmed', 'in_progress', 'completed'].includes(demand.status) && (
            <span className="text-base font-bold text-blue-900">{formatAUD(amount)}</span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-1.5">
          <Calendar size={13} className="text-gray-400" />
          {formatDate(demand.travel_date, locale)}
          {demand.travel_time && ` · ${demand.travel_time.slice(0, 5)}`}
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={13} className="text-gray-400" />
          {demand.pax_count} {t('passengers')}
        </span>
        <span className="flex items-center gap-1.5">
          <Luggage size={13} className="text-gray-400" />
          {demand.luggage_count} {t('luggage')}
        </span>
        {demand.budget_max && (
          <span className="flex items-center gap-1.5">
            <DollarSign size={13} className="text-gray-400" />
            ≤ {formatAUD(demand.budget_max)}
          </span>
        )}
      </div>

      {/* Note */}
      {demand.note && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4 line-clamp-2">
          {demand.note}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Tourist mode */}
        {mode === 'tourist' && (
          <>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {tDash('postedAt', { time: formatRelativeTime(demand.created_at, locale) })}
            </span>
            {demand.status === 'pending' && (
              <span className="text-sm text-blue-700 font-medium">
                {bidCount > 0 ? t('viewBids', { count: bidCount }) : t('waitingBids')}
              </span>
            )}
            {demand.status !== 'pending' && href && (
              <span className="text-sm text-gray-400">{t('viewDetail')}</span>
            )}
          </>
        )}

        {/* Driver mode */}
        {mode === 'driver' && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
              {demand.tourist && (
                <>
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-[10px] shrink-0">
                    {demand.tourist.full_name?.[0] ?? 'U'}
                  </div>
                  <span className="truncate">{demand.tourist.full_name ?? t('touristFallback')}</span>
                  <span className="flex items-center gap-0.5 text-yellow-500 shrink-0">
                    <Star size={10} fill="currentColor" />
                    {demand.tourist.rating?.toFixed(1) ?? '5.0'}
                  </span>
                </>
              )}
              <span className="flex items-center gap-1 text-gray-400 ml-auto shrink-0">
                <Timer size={11} />
                {formatRelativeTime(demand.created_at, locale)}
              </span>
            </div>
            <div className="mt-2 flex justify-end">
              {canBid && !alreadyBid && (
                <Button
                  size="sm"
                  onClick={e => { e.stopPropagation(); onBid?.(demand) }}
                >
                  {t('submitBid')}
                </Button>
              )}
              {!canBid && bidCount > 0 && (
                <span className="text-xs text-gray-400 px-2.5 py-1">
                  {t('bids', { count: bidCount })}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
