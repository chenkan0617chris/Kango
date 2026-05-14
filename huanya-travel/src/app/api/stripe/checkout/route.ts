import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId } = await request.json()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const { data: order } = await supabase
    .from('orders')
    .select('id, amount, payment_status, tourist_id')
    .eq('id', orderId)
    .eq('tourist_id', user.id)
    .maybeSingle()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.payment_status !== 'unpaid') return NextResponse.json({ error: 'Already paid' }, { status: 400 })

  // amount is stored in AUD cents; deposit is 10%
  const depositCents = Math.round(order.amount * 0.1)
  const origin = request.nextUrl.origin

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'aud',
        product_data: { name: 'Charter Trip Deposit (10%)' },
        unit_amount: depositCents,
      },
      quantity: 1,
    }],
    metadata: { order_id: orderId },
    success_url: `${origin}/order/${orderId}?payment=success`,
    cancel_url: `${origin}/order/${orderId}/pay`,
  })

  return NextResponse.json({ url: session.url })
}
