import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { BidsClient } from './BidsClient'
import { DemandStatusBadge } from '@/components/ui/Badge'
import { MapPin, ArrowRight, Calendar, Users, Luggage, DollarSign, ChevronLeft } from 'lucide-react'
import { formatDate, formatAUD } from '@/lib/utils'
import type { Demand } from '@/types'

export const revalidate = 0

export default async function DemandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'tourist') redirect('/driver/marketplace')

  const { data, error } = await supabase
    .from('demands')
    .select(`
      *,
      bids(
        *,
        driver:profiles!driver_id(id, full_name, avatar_url, rating, total_trips, vehicle_type, is_verified)
      )
    `)
    .eq('id', id)
    .eq('tourist_id', user.id)
    .single()

  if (error || !data) redirect('/tourist/dashboard')

  const demand = data as Demand & { bids: any[] }
  const bids: any[] = demand.bids ?? []

  // Sort: active first, then by price ascending
  const sortedBids = [...bids].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    return a.price - b.price
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        {/* Back link */}
        <Link
          href="/tourist/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ChevronLeft size={15} />
          返回我的行程
        </Link>

        {/* Route header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3 min-w-0">
            <MapPin size={20} className="text-blue-900 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-xl leading-tight truncate">
                {demand.pickup_loc}
              </p>
              <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                <ArrowRight size={14} />
                <p className="truncate">{demand.dropoff_loc}</p>
              </div>
            </div>
          </div>
          <DemandStatusBadge status={demand.status} />
        </div>

        {/* Trip meta */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-700">
          <span className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            {formatDate(demand.travel_date)}
            {demand.travel_time && (
              <span className="text-gray-400">· {demand.travel_time.slice(0, 5)}</span>
            )}
          </span>
          <span className="flex items-center gap-2">
            <Users size={14} className="text-gray-400 shrink-0" />
            {demand.pax_count} 名乘客
          </span>
          <span className="flex items-center gap-2">
            <Luggage size={14} className="text-gray-400 shrink-0" />
            {demand.luggage_count} 件行李
          </span>
          {(demand.budget_min || demand.budget_max) && (
            <span className="flex items-center gap-2">
              <DollarSign size={14} className="text-gray-400 shrink-0" />
              预算 {demand.budget_min ? formatAUD(demand.budget_min) : '不限'} –{' '}
              {demand.budget_max ? formatAUD(demand.budget_max) : '不限'}
            </span>
          )}
        </div>

        {demand.note && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
            <span className="font-medium">特殊需求：</span>
            {demand.note}
          </div>
        )}

        {demand.pickup_detail && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-sm text-gray-600">
            <span className="font-medium">详细上车地点：</span>
            {demand.pickup_detail}
          </div>
        )}

        <BidsClient demand={demand} bids={sortedBids} />
      </main>
    </div>
  )
}
