import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { PayClient } from './PayClient'
import { Shield, MapPin, ArrowRight } from 'lucide-react'
import { formatAUD, formatDate } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export const revalidate = 0

export default async function PayPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id, locale } = await params
  const t = await getTranslations('order')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      demand:demands!demand_id(pickup_loc, waypoints, dropoff_loc, travel_date, travel_time, pax_count),
      bid:bids!bid_id(price, vehicle_info, driver:profiles!driver_id(full_name))
    `)
    .eq('id', id)
    .eq('tourist_id', user.id)
    .maybeSingle()

  if (!data) redirect('/tourist/dashboard')

  if (data.payment_status !== 'unpaid') redirect(`/order/${id}`)

  const order = data as any
  const depositAmount = Math.round(order.amount * 0.1)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('payTitle')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('paySub')}</p>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">{t('paySummary')}</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-blue-900 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{order.demand.pickup_loc}</p>
                {(order.demand.waypoints ?? []).map((stop: string, i: number) => (
                  <div key={i} className="flex items-center gap-1 text-gray-500">
                    <ArrowRight size={11} className="shrink-0" />
                    <p className="truncate text-xs">{stop}</p>
                  </div>
                ))}
                <div className="flex items-center gap-1 text-gray-500">
                  <ArrowRight size={11} />
                  <p className="truncate">{order.demand.dropoff_loc}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('travelDate')}</p>
                <p className="text-gray-800">{formatDate(order.demand.travel_date, locale)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('paxCount')}</p>
                <p className="text-gray-800">{order.demand.pax_count} {t('passengers')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('driver')}</p>
                <p className="text-gray-800">{(order.bid as any).driver?.full_name ?? t('driverFallback')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('vehicle')}</p>
                <p className="text-gray-800 truncate">{order.bid.vehicle_info}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 mt-1 space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>{t('totalPrice')}</span>
                <span>{formatAUD(order.amount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-blue-900 text-base">
                <span>{t('depositNow')}</span>
                <span>{formatAUD(depositAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-xs">
                <span>{t('remainingAfter')}</span>
                <span>{formatAUD(order.amount - depositAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Escrow note */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
          <Shield size={16} className="shrink-0 mt-0.5" />
          <span>{t('escrowShort')}</span>
        </div>

        <PayClient orderId={id} depositAmount={depositAmount} />
      </main>
    </div>
  )
}
