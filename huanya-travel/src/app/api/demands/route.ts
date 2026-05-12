import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateDemandInput } from '@/types'

// GET /api/demands — list open demands (for drivers) or own demands (for tourists)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const mine = searchParams.get('mine') === 'true'

  let query = supabase
    .from('demands')
    .select(`
      *,
      tourist:profiles!tourist_id(id, full_name, avatar_url, rating, total_trips),
      bids!demand_id(count)
    `)
    .order('travel_date', { ascending: true })

  if (mine) {
    query = query.eq('tourist_id', user.id)
  } else {
    query = query.in('status', ['pending', 'bidding'])
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// POST /api/demands — tourist creates a new demand
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateDemandInput = await request.json()

  const { pickup_loc, dropoff_loc, travel_date, pax_count, luggage_count } = body
  if (!pickup_loc || !dropoff_loc || !travel_date || !pax_count) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('demands')
    .insert({
      tourist_id:   user.id,
      pickup_loc,
      dropoff_loc,
      pickup_detail: body.pickup_detail ?? null,
      travel_date,
      travel_time:  body.travel_time ?? null,
      pax_count,
      luggage_count: luggage_count ?? 0,
      note:         body.note ?? null,
      budget_min:   body.budget_min ? body.budget_min * 100 : null,
      budget_max:   body.budget_max ? body.budget_max * 100 : null,
      status:       'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
