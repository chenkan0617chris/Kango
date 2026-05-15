import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/shared/Navbar'
import { BidStatusBadge, DemandStatusBadge } from '@/components/ui/Badge'
import { formatAUD, formatDate } from '@/lib/utils'
import { MapPin, ArrowRight, Calendar, Car, ClipboardList, ExternalLink } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { BidStatus, DemandStatus } from '@/types'

export const revalidate = 0

interface BidWithDemand {
  id: string
  demand_id: string
  price: number
  vehicle_info: string
  message: string | null
  status: BidStatus
  created_at: string
  demand: {
    id: string
    pickup_loc: string
    dropoff_loc: string
    travel_date: string
    travel_time: string | null
    status: DemandStatus
  } | null
}

interface OrderSummary {
  id: string
  trip_status: string
  payment_status: string
  amount: number
  bid_id: string
}

const statusGroupColor: Record<string, string> = {
  active: 'bg-blue-50 border-blue-100 text-blue-800',
  accepted: 'bg-green-50 border-green-100 text-green-800',
  ended: 'bg-gray-50 border-gray-200 text-gray-600',
}

function groupKey(status: BidStatus): 'active' | 'accepted' | 'ended' {
  if (status === 'active') return 'active'
  if (status === 'accepted') return 'accepted'
  return 'ended'
}

export default async function DriverBidsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('bids')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'driver') redirect('/driver/marketplace')

  // Use admin client so demand data is visible even after the demand is confirmed (RLS would hide it otherwise)
  const admin = createAdminClient()

  const { data: bidsData } = await admin
    .from('bids')
    .select('*, demand:demands!demand_id(id, pickup_loc, dropoff_loc, travel_date, travel_time, status)')
    .eq('driver_id', user.id)
    .order('created_at', { ascending: false })

  const bids: BidWithDemand[] = (bidsData ?? []) as BidWithDemand[]

  const acceptedBids = bids.filter(b => b.status === 'accepted')
  const acceptedBidIds = acceptedBids.map(b => b.id)

  let orders: OrderSummary[] = []
  if (acceptedBidIds.length > 0) {
    const { data: ordersData } = await admin
      .from('orders')
      .select('id, trip_status, payment_status, amount, bid_id')
      .eq('driver_id', user.id)
      .in('bid_id', acceptedBidIds)

    orders = (ordersData ?? []) as OrderSummary[]
  }

  const orderByBidId = Object.fromEntries(orders.map(o => [o.bid_id, o]))

  const grouped = {
    active:   bids.filter(b => groupKey(b.status) === 'active'),
    accepted: bids.filter(b => groupKey(b.status) === 'accepted'),
    ended:    bids.filter(b => groupKey(b.status) === 'ended'),
  }

  const hasBids = bids.length > 0

  const statusGroupLabel: Record<string, string> = {
    active:   t('statusActive'),
    accepted: t('statusAccepted'),
    ended:    t('statusEnded'),
  }

  const tripStatusLabel: Record<string, string> = {
    confirmed:   t('tripConfirmed'),
    in_progress: t('tripInProgress'),
    completed:   t('tripCompleted'),
    disputed:    t('tripDisputed'),
    cancelled:   t('tripCancelled'),
  }

  const tripStatusColor: Record<string, string> = {
    confirmed:   'text-blue-700 bg-blue-50',
    in_progress: 'text-purple-700 bg-purple-50',
    completed:   'text-green-700 bg-green-50',
    disputed:    'text-red-700 bg-red-50',
    cancelled:   'text-gray-600 bg-gray-100',
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={22} className="text-blue-900" />
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('sub')}</p>
        </div>

        {!hasBids ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={24} className="text-blue-900" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">{t('noBids')}</h2>
            <p className="text-sm text-gray-500 mb-5">{t('noBidsSub')}</p>
            <Link
              href="/driver/marketplace"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-900 text-white text-sm font-medium rounded-xl hover:bg-blue-800 transition-colors"
            >
              {t('goMarketplace')}
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {(['accepted', 'active', 'ended'] as const).map(group => {
              const groupBids = grouped[group]
              if (groupBids.length === 0) return null

              return (
                <section key={group}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${statusGroupColor[group]}`}>
                    <span>{statusGroupLabel[group]}</span>
                    <span className="bg-white/60 rounded-full px-1.5">{groupBids.length}</span>
                  </div>

                  <div className="space-y-3">
                    {groupBids.map(bid => {
                      const order = bid.status === 'accepted' ? orderByBidId[bid.id] : undefined

                      return (
                        <div key={bid.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
                          <div className="flex items-start gap-2 mb-3">
                            <MapPin size={15} className="text-blue-900 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {bid.demand?.pickup_loc ?? '—'}
                              </p>
                              <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                                <ArrowRight size={10} />
                                <p className="truncate">{bid.demand?.dropoff_loc ?? '—'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-gray-400" />
                              <span>
                                {bid.demand?.travel_date
                                  ? formatDate(bid.demand.travel_date, locale)
                                  : '—'}
                                {bid.demand?.travel_time && ` · ${bid.demand.travel_time.slice(0, 5)}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Car size={12} className="text-gray-400" />
                              <span className="truncate max-w-36">{bid.vehicle_info}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <BidStatusBadge status={bid.status} />
                              {bid.demand?.status && (
                                <DemandStatusBadge status={bid.demand.status} />
                              )}
                              {order && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tripStatusColor[order.trip_status] ?? 'text-gray-600 bg-gray-100'}`}>
                                  {tripStatusLabel[order.trip_status] ?? order.trip_status}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-blue-900 text-base">
                              {formatAUD(bid.price)}
                            </span>
                          </div>

                          {order && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <Link
                                href={`/order/${order.id}`}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-900 hover:text-blue-700 transition-colors"
                              >
                                {t('viewOrder')}
                                <ExternalLink size={13} />
                              </Link>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
