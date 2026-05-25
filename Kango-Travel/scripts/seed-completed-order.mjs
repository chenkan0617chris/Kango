/**
 * Seed a completed, paid order between the seeded tourist + driver.
 * Idempotent: cleans previous test data first.
 *
 * Usage: node scripts/seed-completed-order.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
config({ path: path.resolve(__dirname, '..', '.env.local') })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const TOURIST_EMAIL = 'test-tourist@kango.local'
const DRIVER_EMAIL  = 'test-driver@kango.local'

async function findUserId(email) {
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return hit.id
    if (data.users.length < 200) return null
    page += 1
  }
}

async function main() {
  const touristId = await findUserId(TOURIST_EMAIL)
  const driverId  = await findUserId(DRIVER_EMAIL)
  if (!touristId || !driverId) {
    console.error('Missing seeded users — run scripts/seed-test-users.mjs first')
    process.exit(1)
  }

  console.log('Cleaning previous test data...')
  const { data: prevDemands } = await admin
    .from('demands').select('id').eq('tourist_id', touristId)
  const prevDemandIds = (prevDemands ?? []).map(d => d.id)
  if (prevDemandIds.length > 0) {
    await admin.from('reviews').delete().eq('reviewer_id', touristId)
    await admin.from('orders').delete().in('demand_id', prevDemandIds)
    await admin.from('bids').delete().in('demand_id', prevDemandIds)
    await admin.from('demands').delete().in('id', prevDemandIds)
  }

  const travelDate = new Date()
  travelDate.setDate(travelDate.getDate() - 1)
  const { data: demand, error: dErr } = await admin
    .from('demands')
    .insert({
      tourist_id:   touristId,
      pickup_loc:   'Melbourne Airport (MEL), Tullamarine',
      dropoff_loc:  'Great Ocean Road, VIC',
      waypoints:    [],
      travel_date:  travelDate.toISOString().split('T')[0],
      travel_time:  '09:00:00',
      pax_count:    2,
      luggage_count: 2,
      budget_min:   30000,
      budget_max:   50000,
      note:         '希望能多停几个观景点',
      status:       'completed',
    })
    .select('id')
    .single()
  if (dErr) throw dErr
  console.log('  demand:', demand.id)

  const bidPrice = 42000
  const { data: bid, error: bErr } = await admin
    .from('bids')
    .insert({
      demand_id:    demand.id,
      driver_id:    driverId,
      price:        bidPrice,
      vehicle_info: 'Toyota Alphard 7座 · TEST001',
      message:      '我熟悉大洋路沿线',
      status:       'accepted',
    })
    .select('id')
    .single()
  if (bErr) throw bErr
  console.log('  bid:', bid.id)

  await admin.from('demands').update({ accepted_bid_id: bid.id }).eq('id', demand.id)

  const { data: order, error: oErr } = await admin
    .from('orders')
    .insert({
      demand_id:      demand.id,
      bid_id:         bid.id,
      tourist_id:     touristId,
      driver_id:      driverId,
      amount:         bidPrice,
      payment_status: 'paid_in_full',
      trip_status:    'completed',
      tourist_confirmed_at: new Date().toISOString(),
      completed_at:   new Date().toISOString(),
    })
    .select('id')
    .single()
  if (oErr) throw oErr
  console.log('  order:', order.id)

  console.log('\n================ Test Order Created ================')
  console.log(`  Order URL:    http://localhost:3000/zh/order/${order.id}`)
  console.log(`  Driver page:  http://localhost:3000/zh/profile/driver/${driverId}`)
  console.log('====================================================')
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
