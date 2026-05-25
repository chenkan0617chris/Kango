import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/reviews/summary?driver_id=... — aggregated rating summary for a driver (public)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const driverId = searchParams.get('driver_id')
  if (!driverId) {
    return NextResponse.json({ error: '缺少 driver_id 参数' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', driverId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let total = 0
  const ratings = (data ?? []) as { rating: number }[]

  for (const r of ratings) {
    const bucket = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5
    if (bucket >= 1 && bucket <= 5) {
      distribution[bucket] += 1
      total += r.rating
    }
  }

  const count = ratings.length
  const average = count > 0 ? Math.round((total / count) * 100) / 100 : 0

  return NextResponse.json({ data: { average, count, distribution } })
}
