'use client'

import { useState } from 'react'
import { DemandCard } from '@/components/shared/DemandCard'
import { BidModal, type DriverVehicle } from '@/components/shared/BidModal'
import { useRealtimeDemands } from '@/hooks/useRealtimeDemands'
import { Inbox, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Demand } from '@/types'

type SortOption = 'newest' | 'price' | 'date'

interface Props {
  initialDemands: Demand[]
  myBidDemandIds: string[]
  driverVehicles: DriverVehicle[]
}

export function MarketplaceClient({ initialDemands, myBidDemandIds, driverVehicles }: Props) {
  const t = useTranslations('marketplace')
  const { demands } = useRealtimeDemands(initialDemands)
  const [activeDemand, setActiveDemand] = useState<Demand | null>(null)
  const [justBid, setJustBid] = useState<Set<string>>(new Set(myBidDemandIds))
  const [sort, setSort] = useState<SortOption>('newest')

  function handleBidSuccess(demandId: string) {
    setJustBid(prev => new Set(prev).add(demandId))
  }

  function sortDemands(list: Demand[]): Demand[] {
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'price':
          return (b.budget_max ?? 0) - (a.budget_max ?? 0)
        case 'date':
          return new Date(a.travel_date).getTime() - new Date(b.travel_date).getTime()
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }

  const available     = sortDemands(demands.filter(d => d.status === 'pending' && !justBid.has(d.id)))
  const bidded        = demands.filter(d => justBid.has(d.id))
  const sortOptions: SortOption[] = ['newest', 'price', 'date']

  return (
    <>
      <div className="flex items-center gap-1.5 text-xs text-green-600 mb-6">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        {t('realtime')}
        <span className="text-gray-400 ml-1">{t('realtimeSub')}</span>
      </div>

      {demands.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">{t('noTrips')}</p>
          <p className="text-gray-400 text-sm">{t('noTripsSub')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {available.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-4 mb-3 flex-wrap gap-y-2">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {t('available', { count: available.length })}
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">{t('sortLabel')}:</span>
                  {sortOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => setSort(option)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        sort === option
                          ? 'bg-blue-900 text-white border-blue-900'
                          : 'text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-800'
                      }`}
                    >
                      {t(`sort_${option}` as any)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {available.map(demand => (
                  <DemandCard
                    key={demand.id}
                    demand={demand}
                    mode="driver"
                    onBid={setActiveDemand}
                    bidCount={(demand.bids as unknown as { count: number }[])?.[0]?.count ?? 0}
                  />
                ))}
              </div>
            </section>
          )}

          {bidded.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <RefreshCw size={13} /> {t('bidded')}
              </h2>
              <div className="space-y-3 opacity-60">
                {bidded.map(demand => (
                  <DemandCard
                    key={demand.id}
                    demand={demand}
                    mode="driver"
                    alreadyBid
                    bidCount={(demand.bids as unknown as { count: number }[])?.[0]?.count ?? 0}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <BidModal
        demand={activeDemand}
        onClose={() => setActiveDemand(null)}
        onSuccess={handleBidSuccess}
        driverVehicles={driverVehicles}
      />
    </>
  )
}
