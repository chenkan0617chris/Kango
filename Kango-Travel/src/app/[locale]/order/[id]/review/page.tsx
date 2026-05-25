import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/shared/Navbar'
import { TripRoute } from '@/components/shared/TripRoute'
import { Calendar, Users, ChevronLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'
import { ReviewForm } from './ReviewForm'

export const revalidate = 0

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id, locale } = await params
  const tOrder = await getTranslations('order')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  // Tourist-only
  if (profile?.role !== 'tourist') redirect('/')

  // Use admin client — RLS may restrict reads
  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select(`
      id, tourist_id, driver_id, trip_status,
      demand:demands!demand_id(pickup_loc, waypoints, dropoff_loc, return_loc, travel_date, travel_time, pax_count),
      driver:profiles!driver_id(id, full_name)
    `)
    .eq('id', id)
    .maybeSingle()

  if (!order) redirect('/tourist/dashboard')

  // Only the tourist of this order may review
  if (order.tourist_id !== user.id) redirect('/tourist/dashboard')

  // Trip must be completed
  if (order.trip_status !== 'completed') redirect(`/order/${id}`)

  const driver = order.driver as unknown as { id: string; full_name: string | null } | null
  const driverId   = driver?.id   ?? order.driver_id
  const driverName = driver?.full_name?.trim() || tOrder('driverFallback')

  // Already reviewed? -> go to driver profile
  const { data: existingReview } = await admin
    .from('reviews')
    .select('id')
    .eq('order_id', id)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  if (existingReview) redirect(`/profile/driver/${driverId}`)

  const demand = order.demand as unknown as {
    pickup_loc: string
    waypoints: string[] | null
    dropoff_loc: string
    return_loc: string | null
    travel_date: string
    travel_time: string | null
    pax_count: number
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        <Link
          href={`/order/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ChevronLeft size={15} />
          {tOrder('backToMyTrips')}
        </Link>

        {/* Trip summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">{tOrder('tripDetails')}</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <TripRoute
              pickup={demand.pickup_loc}
              dropoff={demand.dropoff_loc}
              waypoints={demand.waypoints ?? []}
              returnLoc={demand.return_loc}
              size="sm"
            />
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} className="text-gray-400 shrink-0" />
              <span>
                {formatDate(demand.travel_date, locale)}
                {demand.travel_time && ` · ${demand.travel_time.slice(0, 5)}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users size={14} className="text-gray-400 shrink-0" />
              <span>{demand.pax_count} {tOrder('passengers')}</span>
            </div>
          </div>
        </div>

        <ReviewForm orderId={id} driverName={driverName} driverId={driverId} />
      </main>
    </div>
  )
}
