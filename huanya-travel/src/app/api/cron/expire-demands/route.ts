import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: staleDemands } = await admin
    .from('demands')
    .select('id')
    .eq('status', 'pending')
    .lt('created_at', threeDaysAgo)

  if (!staleDemands || staleDemands.length === 0) {
    return NextResponse.json({ cancelled: 0, message: 'No stale demands found' })
  }

  const staleIds = staleDemands.map((d: { id: string }) => d.id)

  await admin
    .from('bids')
    .update({ status: 'rejected' })
    .in('demand_id', staleIds)
    .eq('status', 'active')

  const { data: cancelled } = await admin
    .from('demands')
    .update({ status: 'cancelled' })
    .in('id', staleIds)
    .select('id')

  return NextResponse.json({ cancelled: cancelled?.length ?? 0 })
}
