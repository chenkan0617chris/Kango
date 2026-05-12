import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/demands/[id] — demand detail with all bids
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('demands')
    .select(`
      *,
      tourist:profiles!tourist_id(id, full_name, avatar_url, rating, total_trips),
      bids!demand_id(
        *,
        driver:profiles!driver_id(id, full_name, avatar_url, rating, total_trips, vehicle_type, is_verified)
      )
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({ data })
}

// PATCH /api/demands/[id] — update status or accept a bid
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Verify ownership
  const { data: demand } = await supabase
    .from('demands')
    .select('tourist_id, status')
    .eq('id', id)
    .single()

  if (!demand || demand.tourist_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Accept a bid: mark bid accepted, reject others, create order, lock demand
  if (body.action === 'accept_bid' && body.bid_id) {
    if (!['pending', 'bidding'].includes(demand.status)) {
      return NextResponse.json({ error: '该需求已关闭报价' }, { status: 400 })
    }

    const { data: bid } = await supabase
      .from('bids')
      .select('id, price, driver_id, status')
      .eq('id', body.bid_id)
      .eq('demand_id', id)
      .single()

    if (!bid) return NextResponse.json({ error: '报价不存在' }, { status: 404 })
    if (bid.status !== 'active') return NextResponse.json({ error: '该报价已失效' }, { status: 400 })

    // Use admin client to bypass RLS — tourist cannot write to bids/orders rows owned by drivers
    const admin = createAdminClient()

    // Reject all other active bids
    const { error: rejectErr } = await admin
      .from('bids')
      .update({ status: 'rejected' })
      .eq('demand_id', id)
      .eq('status', 'active')
      .neq('id', body.bid_id)
    if (rejectErr) return NextResponse.json({ error: rejectErr.message }, { status: 500 })

    // Accept the chosen bid
    const { error: acceptErr } = await admin
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', body.bid_id)
    if (acceptErr) return NextResponse.json({ error: acceptErr.message }, { status: 500 })

    // Lock the demand
    const { error: demandErr } = await admin
      .from('demands')
      .update({ status: 'confirmed', accepted_bid_id: body.bid_id })
      .eq('id', id)
    if (demandErr) return NextResponse.json({ error: demandErr.message }, { status: 500 })

    // Create order
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        demand_id:  id,
        bid_id:     body.bid_id,
        tourist_id: user.id,
        driver_id:  bid.driver_id,
        amount:     bid.price,
      })
      .select()
      .single()

    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })

    return NextResponse.json({ data: order })
  }

  // Cancel demand
  if (body.status === 'cancelled') {
    if (!['pending', 'bidding'].includes(demand.status)) {
      return NextResponse.json({ error: '该状态不可取消' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('demands')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: '无效操作' }, { status: 400 })
}
