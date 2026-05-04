import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { MarketplaceClient } from './MarketplaceClient'
import { Car } from 'lucide-react'
import type { Demand } from '@/types'

export const revalidate = 0 // always fresh on entry

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify driver role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'driver') redirect('/demand/create')

  // Fetch open demands
  const { data } = await supabase
    .from('demands')
    .select(`
      *,
      tourist:profiles!tourist_id(id, full_name, avatar_url, rating, total_trips),
      bids(count)
    `)
    .in('status', ['pending', 'bidding'])
    .order('travel_date', { ascending: true })
    .limit(50)

  const initialDemands = (data ?? []) as Demand[]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Car size={22} className="text-blue-900" />
              接单大厅
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              找到合适的行程，一键提交报价
            </p>
          </div>
        </div>

        {/* Tips banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800 flex items-start gap-2">
          <span className="shrink-0 mt-0.5">💡</span>
          <span>
            报价时简洁说明车型和优势，附上具体价格，成单率更高。游客会同时看到多个报价，请认真填写。
          </span>
        </div>

        <MarketplaceClient initialDemands={initialDemands} />
      </main>
    </div>
  )
}
