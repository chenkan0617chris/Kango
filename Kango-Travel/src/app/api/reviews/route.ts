import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/reviews?driver_id=...&limit=20 — list reviews received by a driver (public)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const driverId = searchParams.get('driver_id')
  if (!driverId) {
    return NextResponse.json({ error: '缺少 driver_id 参数' }, { status: 400 })
  }

  const limitParam = Number(searchParams.get('limit') ?? '20')
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(Math.floor(limitParam), 50)
    : 20

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviewer_id(full_name, avatar_url)
    `)
    .eq('reviewee_id', driverId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// POST /api/reviews — tourist submits a review for the driver after trip completion
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { order_id, rating, comment } = body

  if (!order_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  if (typeof comment === 'string' && comment.length > 500) {
    return NextResponse.json({ error: '评论最多 500 字' }, { status: 400 })
  }

  const { data: order } = await supabase
    .from('orders')
    .select('tourist_id, driver_id, trip_status')
    .eq('id', order_id)
    .single()

  if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  if (order.tourist_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (order.trip_status !== 'completed') return NextResponse.json({ error: '行程尚未完成' }, { status: 400 })

  const { data: review, error: insertError } = await supabase
    .from('reviews')
    .insert({
      order_id,
      reviewer_id: user.id,
      reviewee_id: order.driver_id,
      rating: Math.round(rating),
      comment: comment ?? null,
    })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: '您已对此行程提交过评价' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Recalculate driver's average rating
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', order.driver_id)

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce(
      (sum: number, r: { rating: number }) => sum + r.rating, 0
    ) / allReviews.length
    await supabase
      .from('profiles')
      .update({ rating: Math.round(avg * 100) / 100 })
      .eq('id', order.driver_id)
  }

  return NextResponse.json({ data: review }, { status: 201 })
}
