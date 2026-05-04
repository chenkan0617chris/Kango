import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({ data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data: order } = await supabase
    .from('orders')
    .select('tourist_id, payment_status')
    .eq('id', id)
    .single()

  if (!order || order.tourist_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (body.action === 'pay_deposit') {
    if (order.payment_status !== 'unpaid') {
      return NextResponse.json({ error: '已支付，请勿重复操作' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'deposited',
        tourist_confirmed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: '无效操作' }, { status: 400 })
}
