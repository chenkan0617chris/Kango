import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { Button } from '@/components/ui/Button'
import {
  CheckCircle, MapPin, Calendar, Phone, Car,
  ArrowRight, Shield, Lock, Star, Users,
} from 'lucide-react'
import { formatAUD, formatDate } from '@/lib/utils'

export const revalidate = 0

export default async function OrderPage({
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

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      demand:demands!demand_id(pickup_loc, dropoff_loc, travel_date, travel_time, pax_count, luggage_count, note),
      bid:bids!bid_id(price, vehicle_info),
      driver:profiles!driver_id(id, full_name, phone, avatar_url, rating, total_trips, vehicle_type, vehicle_plate, is_verified),
      tourist:profiles!tourist_id(id, full_name, phone)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    redirect(profile?.role === 'driver' ? '/driver/marketplace' : '/tourist/dashboard')
  }

  const order = data as any
  const isPaid = order.payment_status !== 'unpaid'
  const isDriver = profile?.role === 'driver'
  const isTourist = profile?.role === 'tourist'

  // Tourist who hasn't paid yet → go pay
  if (isTourist && !isPaid) redirect(`/order/${id}/pay`)

  const depositAmount = Math.round(order.amount * 0.1)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">行程已确认</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isPaid
              ? `定金 ${formatAUD(depositAmount)} 已托管，出行前联系${isDriver ? '游客' : '司机'}确认细节`
              : '等待游客支付定金'}
          </p>
        </div>

        {/* Trip details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">行程信息</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <MapPin size={15} className="text-blue-900 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{order.demand.pickup_loc}</p>
                <div className="flex items-center gap-1 text-gray-500">
                  <ArrowRight size={11} />
                  <p>{order.demand.dropoff_loc}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} className="text-gray-400 shrink-0" />
              <span>
                {formatDate(order.demand.travel_date)}
                {order.demand.travel_time && ` · ${order.demand.travel_time.slice(0, 5)}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users size={14} className="text-gray-400 shrink-0" />
              <span>{order.demand.pax_count} 名乘客</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Car size={14} className="text-gray-400 shrink-0" />
              <span>{order.bid.vehicle_info}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>行程总价</span>
              <span className="font-bold text-blue-900 text-base">{formatAUD(order.amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>已付定金 (10%)</span>
              <span>{isPaid ? formatAUD(depositAmount) : '待支付'}</span>
            </div>
          </div>
        </div>

        {/* Contact info — gated behind payment */}
        <div className={`rounded-2xl border p-6 mb-5 ${isPaid ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-900">
              {isDriver ? '游客联系方式' : '司机联系方式'}
            </h2>
            {!isPaid && <Lock size={13} className="text-gray-400" />}
          </div>

          {isPaid ? (
            <div className="space-y-4">
              {isTourist ? (
                // Tourist sees driver contact
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
                            认证
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Star size={10} className="text-yellow-500" fill="currentColor" />
                        <span>{order.driver?.rating?.toFixed(1) ?? '5.0'}</span>
                        <span>·</span>
                        <span>{order.driver?.total_trips ?? 0} 次行程</span>
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
                    <p className="text-sm text-gray-400">司机暂未填写联系电话</p>
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
                // Driver sees tourist contact
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-base shrink-0">
                      {order.tourist?.full_name?.[0] ?? 'T'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{order.tourist?.full_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">游客</p>
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
                    <p className="text-sm text-gray-400">游客暂未填写联系电话</p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Lock size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 font-medium mb-1">联系方式尚未解锁</p>
              <p className="text-xs text-gray-400">游客支付定金后，双方才能看到对方联系方式</p>
              {isTourist && (
                <Link href={`/order/${id}/pay`}>
                  <Button size="sm" className="mt-4">立即支付定金</Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Escrow reminder */}
        {isPaid && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
            <Shield size={16} className="shrink-0 mt-0.5" />
            <span>
              定金 {formatAUD(depositAmount)} 已由平台托管，行程完成后自动结算。
              如有纠纷请通过平台客服处理，请勿私下转账。
            </span>
          </div>
        )}

        {/* Navigation */}
        <Link href={isDriver ? '/driver/marketplace' : '/tourist/dashboard'}>
          <Button variant="secondary" className="w-full">
            {isDriver ? '返回接单大厅' : '返回我的行程'}
          </Button>
        </Link>
      </main>
    </div>
  )
}
