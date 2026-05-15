import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/bids/[id] — driver withdraws their bid
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

  // Only driver who owns the bid can withdraw
  const { data: bid } = await supabase
    .from('bids')
    .select('driver_id, status')
    .eq('id', id)
    .single()

  if (!bid || bid.driver_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (bid.status !== 'active') {
    return NextResponse.json({ error: '只能撤回进行中的报价' }, { status: 400 })
  }

  if (body.status !== 'withdrawn') {
    return NextResponse.json({ error: '无效操作' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bids')
    .update({ status: 'withdrawn' })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
