'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { DemandCard } from '@/components/shared/DemandCard'
import { Button } from '@/components/ui/Button'
import { Inbox, Plus } from 'lucide-react'
import type { Demand, DemandStatus } from '@/types'

type Filter = 'all' | DemandStatus

const ALL_STATUSES: DemandStatus[] = [
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled',
]

interface Props {
  demands: (Demand & { bids: { count: number }[], orders?: { amount: number }[] })[]
}

export function DashboardClient({ demands }: Props) {
  const t      = useTranslations('dashboard')
  const tBadge = useTranslations('badge')
  const [filter, setFilter] = useState<Filter>('all')

  const countByStatus = useMemo(() => {
    const counts: Partial<Record<DemandStatus, number>> = {}
    for (const d of demands) counts[d.status] = (counts[d.status] ?? 0) + 1
    return counts
  }, [demands])

  const filtered = useMemo(
    () => filter === 'all' ? demands : demands.filter(d => d.status === filter),
    [filter, demands],
  )

  if (demands.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Inbox size={24} className="text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium mb-1">{t('noTrips')}</p>
        <p className="text-gray-400 text-sm mb-6">{t('noTripsSub')}</p>
        <Link href="/demand/create">
          <Button>{t('postFirst')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('filterAll')} ({demands.length})
        </button>
        {ALL_STATUSES.map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === status
                ? 'bg-blue-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tBadge(status)} ({countByStatus[status] ?? 0})
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-12">{t('noResults')}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(demand => (
            <DemandCard
              key={demand.id}
              demand={demand}
              mode="tourist"
              bidCount={demand.bids?.[0]?.count ?? 0}
              href={`/demand/${demand.id}`}
              amount={demand.orders?.[0]?.amount}
            />
          ))}
        </div>
      )}
    </>
  )
}
