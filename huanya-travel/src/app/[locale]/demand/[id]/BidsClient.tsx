'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from '@/i18n/navigation'
import { Star, CheckCircle, Car, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { BidStatusBadge } from '@/components/ui/Badge'
import { formatAUD } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { Demand, Bid, Profile } from '@/types'

type BidWithDriver = Bid & { driver: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'rating' | 'total_trips' | 'vehicle_type' | 'is_verified'> }

interface Props {
  demand: Demand
  bids: BidWithDriver[]
}

export function BidsClient({ demand, bids }: Props) {
  const t = useTranslations('demand')
  const router = useRouter()
  const [accepting, setAccepting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const isOpen = ['pending', 'bidding'].includes(demand.status)

  async function handleAccept(bidId: string) {
    setAccepting(bidId)
    setError('')
    try {
      const res = await fetch(`/api/demands/${demand.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept_bid', bid_id: bidId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? t('submitError'))
      } else {
        router.push(`/order/${json.data.id}/pay`)
      }
    } catch {
      setError(t('networkError'))
    } finally {
      setAccepting(null)
    }
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-16">
        <Car size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="font-medium text-gray-500 mb-1">{t('noBids')}</p>
        <p className="text-sm text-gray-400">{t('noBidsSub')}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        {t('bidsTitle', { count: bids.length })}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {bids.map(bid => (
          <div
            key={bid.id}
            className={`bg-white rounded-2xl border p-5 transition-all ${
              bid.status === 'accepted'
                ? 'border-green-300 bg-green-50'
                : bid.status === 'active'
                ? 'border-gray-200 hover:border-blue-200 hover:shadow-md'
                : 'border-gray-100 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-900 text-sm shrink-0">
                  {bid.driver?.full_name?.[0] ?? 'D'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/driver/${bid.driver?.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                      {bid.driver?.full_name ?? 'Driver'}
                      <ExternalLink size={10} className="text-gray-400" />
                    </Link>
                    {bid.driver?.is_verified && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                        {t('verified')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-0.5 text-yellow-500">
                      <Star size={10} fill="currentColor" />
                      {bid.driver?.rating?.toFixed(1) ?? '5.0'}
                    </span>
                    <span>·</span>
                    <span>{bid.driver?.total_trips ?? 0} {t('trips')}</span>
                    {bid.driver?.vehicle_type && (
                      <>
                        <span>·</span>
                        <span>{bid.driver.vehicle_type}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <p className="text-xl font-bold text-blue-900">{formatAUD(bid.price)}</p>
                <div className="mt-1">
                  <BidStatusBadge status={bid.status} />
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3">
              <span className="font-medium">{t('vehicleLabel')}</span>{bid.vehicle_info}
            </div>

            {bid.message && (
              <p className="text-sm text-gray-500 italic mb-3 line-clamp-3">
                "{bid.message}"
              </p>
            )}

            {isOpen && bid.status === 'active' && (
              <Button
                size="sm"
                className="w-full"
                loading={accepting === bid.id}
                onClick={() => handleAccept(bid.id)}
              >
                <CheckCircle size={14} />
                {t('selectBid')}
              </Button>
            )}

            {bid.status === 'accepted' && (
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium mt-1">
                <CheckCircle size={14} />
                {t('alreadySelected')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
