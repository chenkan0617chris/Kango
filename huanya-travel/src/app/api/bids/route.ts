import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateBidInput } from '@/types'

// GET /api/bids?demand_id=xxx — list bids for a demand
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const demandId = new URL(request.url).searchParams.get('demand_id')
  if (!demandId) return NextResponse.json({ error: '缺少 demand_id' }, { status: 400 })

  const { data, error } = await supabase
    .from('bids')
    .select(`
      *,
      driver:profiles!driver_id(id, full_name, avatar_url, rating, total_trips, vehicle_type, is_verified, bio)
    `)
    .eq('demand_id', demandId)
    .order('price', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// POST /api/bids — driver submits a bid
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user is a driver
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'driver') {
    return NextResponse.json({ error: '只有司机可以报价' }, { status: 403 })
  }

  const body: CreateBidInput = await request.json()
  const { demand_id, price, vehicle_info } = body

  if (!demand_id || !price || !vehicle_info) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  // Check demand is still open
  const { data: demand } = await supabase
    .from('demands')
    .select('status')
    .eq('id', demand_id)
    .single()

  if (!demand || !['pending', 'bidding'].includes(demand.status)) {
    return NextResponse.json({ error: '该需求已关闭报价' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bids')
    .insert({
      demand_id,
      driver_id:    user.id,
      price:        Math.round(price * 100), // dollars -> cents
      vehicle_info,
      message: body.message ?? null,
    })
    .select()
    .single()

  if (error) {
    // Unique violation: driver already bid on this demand
    if (error.code === '23505') {
      return NextResponse.json({ error: '您已对该需求报过价' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transition demand to 'bidding' if still 'pending'
  if (demand.status === 'pending') {
    await supabase.from('demands').update({ status: 'bidding' }).eq('id', demand_id)
  }

  return NextResponse.json({ data }, { status: 201 })
}
