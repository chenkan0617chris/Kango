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

  const { searchParams } = new URL(request.url)
  const demandId = searchParams.get('demand_id')
  const mine     = searchParams.get('mine')

  if (mine === 'true') {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        demand:demands!demand_id(id, pickup_loc, dropoff_loc, travel_date, travel_time, status),
        driver:profiles!driver_id(id, full_name, avatar_url, rating)
      `)
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (!demandId) return NextResponse.json({ error: '缺少 demand_id 或 mine=true' }, { status: 400 })

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
    .select('role, vehicle_plate')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'driver') {
    return NextResponse.json({ error: '只有司机可以报价' }, { status: 403 })
  }

  if (!profile?.vehicle_plate) {
    return NextResponse.json({ error: '请先完善您的车辆信息才能报价，前往「车辆设置」页面填写' }, { status: 403 })
  }

  const body: CreateBidInput = await request.json()
  const { demand_id, price, vehicle_info } = body

  if (!demand_id || !price || !vehicle_info) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  // Check demand is still open
  const { data: demand } = await supabase
    .from('demands')
    .select('status, budget_min, budget_max')
    .eq('id', demand_id)
    .single()

  if (!demand || demand.status !== 'pending') {
    return NextResponse.json({ error: '该需求已关闭报价' }, { status: 400 })
  }

  const priceInCents = Math.round(price * 100)
  if (demand.budget_min && priceInCents < demand.budget_min) {
    return NextResponse.json({
      error: `报价不得低于游客最低预算 $${Math.round(demand.budget_min / 100)} AUD`,
    }, { status: 400 })
  }
  if (demand.budget_max && priceInCents > demand.budget_max) {
    return NextResponse.json({
      error: `报价不得高于游客最高预算 $${Math.round(demand.budget_max / 100)} AUD`,
    }, { status: 400 })
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

  return NextResponse.json({ data }, { status: 201 })
}
