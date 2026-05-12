'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { MapPin, Calendar, Users, Luggage, DollarSign, ArrowRight, Star } from 'lucide-react'
import { DemandStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatAUD } from '@/lib/utils'
import type { Demand } from '@/types'

interface DemandCardProps {
  demand: Demand
  mode: 'tourist' | 'driver'
  onBid?: (demand: Demand) => void
  bidCount?: number
  href?: string
}

export function DemandCard({ demand, mode, onBid, bidCount = 0, href }: DemandCardProps) {
  const locale = useLocale()
  const t = useTranslations('demandCard')
  const canBid = mode === 'driver' && ['pending', 'bidding'].includes(demand.status)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200">
      {/* Header: route + status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MapPin size={15} className="text-blue-900 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{demand.pickup_loc}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ArrowRight size={11} className="text-gray-400 shrink-0" />
              <p className="text-sm text-gray-600 truncate">{demand.dropoff_loc}</p>
            </div>
          </div>
        </div>
        <DemandStatusBadge status={demand.status} />
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
        {(demand.budget_min || demand.budget_max) && (
          <span className="flex items-center gap-1.5">
            <DollarSign size={13} className="text-gray-400" />
            {demand.budget_min ? formatAUD(demand.budget_min) : '?'}
            {' – '}
            {demand.budget_max ? formatAUD(demand.budget_max) : '?'}
          </span>
        )}
      </div>

      {/* Note */}
      {demand.note && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4 line-clamp-2">
          {demand.note}
        </p>
      )}

      {/* Driver info (tourist view) or bid count + action (driver view) */}
      <div className="flex items-center justify-between">
        {mode === 'driver' && demand.tourist && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-[10px]">
              {demand.tourist.full_name?.[0] ?? 'U'}
            </div>
            <span>{demand.tourist.full_name ?? t('touristFallback')}</span>
            <span className="flex items-center gap-0.5 text-yellow-500">
              <Star size={10} fill="currentColor" />
              {demand.tourist.rating?.toFixed(1) ?? '5.0'}
            </span>
          </div>
        )}

        {mode === 'tourist' && (
          href ? (
            <Link
              href={href}
              className="text-sm text-blue-700 font-medium hover:underline"
            >
              {bidCount > 0 ? t('viewBids', { count: bidCount }) : t('waitingBids')}
            </Link>
          ) : (
            <span className="text-xs text-gray-500">
              {bidCount > 0 ? t('bids', { count: bidCount }) : t('zeroBids')}
            </span>
          )
        )}

        {canBid && (
          <Button size="sm" onClick={() => onBid?.(demand)}>
            {t('submitBid')}
          </Button>
        )}

        {mode === 'driver' && !canBid && (
          <span className="text-xs text-gray-400">
            {bidCount > 0 ? t('bids', { count: bidCount }) : ''}
          </span>
        )}
      </div>
    </div>
  )
}
