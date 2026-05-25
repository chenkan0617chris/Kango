import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import {
  Star, Car, Shield, BadgeCheck,
  ChevronLeft,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { VehicleEditForm } from './VehicleEditForm'
import { StarRating } from '@/components/ui/StarRating'
import type { Profile } from '@/types'

export const revalidate = 0

export default async function DriverProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id, locale } = await params
  const supabase = await createClient()

  const [{ data: driver }, { data: { user } }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).eq('role', 'driver').maybeSingle(),
    supabase.auth.getUser(),
  ])

  if (!driver) notFound()

  const isOwner = user?.id === id

  const profile = driver as Profile

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, created_at,
      reviewer:profiles!reviewer_id(full_name, avatar_url)
    `)
    .eq('reviewee_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const reviewList = (reviews ?? []) as unknown as {
    id: string
    rating: number
    comment: string | null
    created_at: string
    reviewer: { full_name: string | null; avatar_url: string | null } | null
  }[]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 pb-12">
        {/* Back */}
        <Link
          href="/driver/marketplace"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ChevronLeft size={15} />
          返回接单大厅
        </Link>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center font-bold text-blue-900 text-3xl shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.full_name ?? '司机'} className="w-full h-full object-cover" />
              ) : (
                profile.full_name?.[0] ?? 'D'
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-gray-900">{profile.full_name ?? '司机'}</h1>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    <BadgeCheck size={11} />
                    已认证
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <StarRating value={profile.rating} size={14} />
                <span className="text-sm font-semibold text-gray-900">
                  {profile.rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-400">
                  · {profile.total_trips} 次行程
                </span>
              </div>

              {profile.bio && (
                <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle & Credentials */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car size={16} className="text-blue-900" />
            车辆信息
          </h2>

          {isOwner ? (
            <VehicleEditForm
              driverId={id}
              initialVehicleType={profile.vehicle_type ?? null}
              initialPlate={profile.vehicle_plate ?? null}
            />
          ) : (
            <div className="space-y-3">
              {profile.vehicle_type && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">车型</span>
                  <span className="font-medium text-gray-900">{profile.vehicle_type}</span>
                </div>
              )}
              {profile.vehicle_plate && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">车牌号码</span>
                  <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                    {profile.vehicle_plate}
                  </span>
                </div>
              )}
              {!profile.vehicle_type && !profile.vehicle_plate && (
                <p className="text-sm text-gray-400">暂无车辆信息</p>
              )}
            </div>
          )}
        </div>

        {/* DA / Accreditation */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={16} className="text-blue-900" />
            澳洲认证信息
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Driver Accreditation (DA)</span>
              {profile.license_no ? (
                <span className="font-mono font-semibold text-gray-900 bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                  {profile.license_no}
                </span>
              ) : (
                <span className="text-gray-400 text-xs">待上传</span>
              )}
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">认证状态</span>
              {profile.is_verified ? (
                <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                  <BadgeCheck size={13} />
                  平台已核验
                </span>
              ) : (
                <span className="text-yellow-600 text-xs font-medium">审核中</span>
              )}
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
              澳洲网约车司机须持有相应州政府颁发的 Driver Accreditation 资质。
              环亚出行会核验每位司机的 DA 编号，确保乘客安全。
            </p>
          </div>
        </div>

        {/* Reviews */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star size={16} className="text-yellow-400" fill="currentColor" />
            历史评价 ({reviewList.length})
          </h2>

          {reviewList.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">暂无评价</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewList.map(review => (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {review.reviewer?.full_name?.[0] ?? 'U'}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {review.reviewer?.full_name ?? '游客'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StarRating value={review.rating} size={14} />
                      <span className="text-xs text-gray-500">{formatDate(review.created_at, locale)}</span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
