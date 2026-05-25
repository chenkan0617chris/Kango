import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/orders/[id]/review — check whether the current tourist has reviewed this order
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('tourist_id')
    .eq('id', id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  if (order.tourist_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', id)
    .maybeSingle()

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      reviewed: !!review,
      review: review ?? null,
    },
  })
}
