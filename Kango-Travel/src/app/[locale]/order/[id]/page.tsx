import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/shared/Navbar'
import { Button } from '@/components/ui/Button'
import { DriverStatusClient } from './DriverStatusClient'
import { TripRoute } from '@/components/shared/TripRoute'
import {
  CheckCircle, Calendar, Phone, Car,
  Shield, Lock, Star, Users,
} from 'lucide-react'
import { formatAUD, formatDate } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export const revalidate = 0

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const t = await getTranslations('order')
  const { id, locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  // Use admin client — RLS may restrict drivers from reading orders/demands/bids they don't own as tourist
  const admin = createAdminClient()
  const { data } = await admin
    .from('orders')
    .select(`
      *,
      demand:demands!demand_id(pickup_loc, waypoints, dropoff_loc, return_loc, travel_date, travel_time, pax_count, luggage_count, note),
      bid:bids!bid_id(price, vehicle_info),
      driver:profiles!driver_id(id, full_name, phone, avatar_url, rating, total_trips, vehicle_type, vehicle_plate, is_verified),
      tourist:profiles!tourist_id(id, full_name, phone)
    `)
    .eq('id', id)
    .maybeSingle()

  if (!data) {
    redirect(profile?.role === 'driver' ? '/driver/marketplace' : '/tourist/dashboard')
  }

  // Authorization: only the tourist or driver of this order may view it
  if (data.tourist_id !== user.id && data.driver_id !== user.id) {
    redirect(profile?.role === 'driver' ? '/driver/marketplace' : '/tourist/dashboard')
  }

  const order = data as any
  const isPaid = order.payment_status !== 'unpaid'
  const isDriver = profile?.role === 'driver'
  const isTourist = profile?.role === 'tourist'

  // Tourist who hasn't paid yet → go pay
  if (isTourist && !isPaid) redirect(`/order/${id}/pay`)

  const depositAmount = Math.round(order.amount * 0.1)

  // Has the tourist already reviewed this completed trip?
  let hasReviewed = false
  if (isTourist && order.trip_status === 'completed') {
    const { data: existingReview } = await admin
      .from('reviews')
      .select('id')
      .eq('order_id', id)
      .eq('reviewer_id', user.id)
      .maybeSingle()
    hasReviewed = !!existingReview
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('confirmed')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isPaid
              ? t('depositHeld', { amount: formatAUD(depositAmount), party: isDriver ? t('touristContact') : t('driverContact') })
              : t('waitingDeposit')}
          </p>
        </div>

        {/* Trip details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">{t('tripDetails')}</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <TripRoute
              pickup={order.demand.pickup_loc}
              dropoff={order.demand.dropoff_loc}
              waypoints={order.demand.waypoints}
              returnLoc={order.demand.return_loc}
              size="sm"
            />
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} className="text-gray-400 shrink-0" />
              <span>
                {formatDate(order.demand.travel_date, locale)}
                {order.demand.travel_time && ` · ${order.demand.travel_time.slice(0, 5)}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users size={14} className="text-gray-400 shrink-0" />
              <span>{order.demand.pax_count} {t('passengers')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Car size={14} className="text-gray-400 shrink-0" />
              <span>{order.bid.vehicle_info}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{t('totalPrice')}</span>
              <span className="font-bold text-blue-900 text-base">{formatAUD(order.amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{t('depositPaid')}</span>
              <span>{isPaid ? formatAUD(depositAmount) : t('pending')}</span>
            </div>
          </div>
        </div>

        {/* Contact info — gated behind payment */}
        <div className={`rounded-2xl border p-6 mb-5 ${isPaid ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-900">
              {isDriver ? t('touristContact') : t('driverContact')}
            </h2>
            {!isPaid && <Lock size={13} className="text-gray-400" />}
          </div>

          {isPaid ? (
            <div className="space-y-4">
              {isTourist ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-900 text-base shrink-0">
                      {order.driver?.full_name?.[0] ?? 'D'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{order.driver?.full_name}</p>
                        {order.driver?.is_verified && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                            {t('verified')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Star size={10} className="text-yellow-500" fill="currentColor" />
                        <span>{order.driver?.rating?.toFixed(1) ?? '5.0'}</span>
                        <span>·</span>
                        <span>{order.driver?.total_trips ?? 0} {t('trips')}</span>
                      </div>
                    </div>
                  </div>

                  {order.driver?.phone ? (
                    <a
                      href={`tel:${order.driver.phone}`}
                      className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 transition-colors rounded-xl px-4 py-3 text-blue-800 font-medium text-sm"
                    >
                      <Phone size={16} className="shrink-0" />
                      {order.driver.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">{t('noPhone')}</p>
                  )}

                  {(order.driver?.vehicle_type || order.driver?.vehicle_plate) && (
                    <div className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
                      <Car size={14} className="text-gray-400 shrink-0" />
                      <span>
                        {order.driver.vehicle_type}
                        {order.driver.vehicle_plate && ` · ${order.driver.vehicle_plate}`}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-base shrink-0">
                      {order.tourist?.full_name?.[0] ?? 'T'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{order.tourist?.full_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t('touristContact')}</p>
                    </div>
                  </div>

                  {order.tourist?.phone ? (
                    <a
                      href={`tel:${order.tourist.phone}`}
                      className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 transition-colors rounded-xl px-4 py-3 text-blue-800 font-medium text-sm"
                    >
                      <Phone size={16} className="shrink-0" />
                      {order.tourist.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">{t('noPhone')}</p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Lock size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 font-medium mb-1">{t('contactLocked')}</p>
              <p className="text-xs text-gray-400">{t('contactLockedSub')}</p>
              {isTourist && (
                <Link href={`/order/${id}/pay`}>
                  <Button size="sm" className="mt-4">{t('payDeposit')}</Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {isPaid && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
            <Shield size={16} className="shrink-0 mt-0.5" />
            <span>{t('escrowNote', { amount: formatAUD(depositAmount) })}</span>
          </div>
        )}

        {isDriver && isPaid && (
          <div className="mb-4">
            <DriverStatusClient orderId={id} tripStatus={order.trip_status} />
          </div>
        )}

        {isTourist && order.trip_status === 'completed' && (
          <div className="mb-3">
            {hasReviewed ? (
              <Link href={`/profile/driver/${order.driver_id}`}>
                <Button variant="secondary" className="w-full">
                  {t('viewMyReview')}
                </Button>
              </Link>
            ) : (
              <Link href={`/order/${id}/review`}>
                <Button className="w-full">
                  {t('reviewCta')}
                </Button>
              </Link>
            )}
          </div>
        )}

        <Link href={isDriver ? '/driver/bids' : '/tourist/dashboard'}>
          <Button variant="secondary" className="w-full">
            {isDriver ? t('backToMyBids') : t('backToMyTrips')}
          </Button>
        </Link>
      </main>
    </div>
  )
}
