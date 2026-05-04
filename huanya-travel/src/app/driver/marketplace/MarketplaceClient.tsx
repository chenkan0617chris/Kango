'use client'

import { useState } from 'react'
import { DemandCard } from '@/components/shared/DemandCard'
import { BidModal } from '@/components/shared/BidModal'
import { useRealtimeDemands } from '@/hooks/useRealtimeDemands'
import { Inbox, RefreshCw } from 'lucide-react'
import type { Demand } from '@/types'

interface Props {
  initialDemands: Demand[]
}

export function MarketplaceClient({ initialDemands }: Props) {
  const { demands } = useRealtimeDemands(initialDemands)
  const [activeDemand, setActiveDemand] = useState<Demand | null>(null)
  const [justBid, setJustBid]           = useState<Set<string>>(new Set())

  function handleBidSuccess(demandId: string) {
    setJustBid(prev => new Set(prev).add(demandId))
  }

  const available = demands.filter(d => ['pending', 'bidding'].includes(d.status) && !justBid.has(d.id))
  const bidded    = demands.filter(d => justBid.has(d.id))

  return (
    <>
      {/* Realtime indicator */}
      <div className="flex items-center gap-1.5 text-xs text-green-600 mb-6">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        实时更新中
        <span className="text-gray-400 ml-1">· 新需求将自动出现</span>
      </div>

      {demands.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">暂无行程需求</p>
          <p className="text-gray-400 text-sm">新需求发布后将自动出现在这里</p>
        </div>
      ) : (
        <div className="space-y-8">
          {available.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                可报价需求 · {available.length}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <RefreshCw size={13} /> 已报价
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {bidded.map(demand => (
                  <DemandCard
                    key={demand.id}
                    demand={demand}
                    mode="driver"
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
      />
    </>
  )
}
