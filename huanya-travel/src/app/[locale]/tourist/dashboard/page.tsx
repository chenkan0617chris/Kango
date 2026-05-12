import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { DemandCard } from '@/components/shared/DemandCard'
import { Button } from '@/components/ui/Button'
import { Plus, Inbox } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Demand } from '@/types'

export default async function TouristDashboard() {
  const t = await getTranslations('dashboard')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: demands } = await supabase
    .from('demands')
    .select(`
      *,
      bids!demand_id(count)
    `)
    .eq('tourist_id', user.id)
    .order('created_at', { ascending: false })

  const list = (demands ?? []) as (Demand & { bids: { count: number }[] })[]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('demandCount', { count: list.length })}</p>
          </div>
          <Link href="/demand/create">
            <Button>
              <Plus size={16} />
              {t('postNew')}
            </Button>
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Inbox size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-1">{t('noTrips')}</p>
            <p className="text-gray-400 text-sm mb-6">{t('noTripsSub')}</p>
            <Link href="/demand/create">
              <Button>{t('postFirst')}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {list.map(demand => (
              <DemandCard
                key={demand.id}
                demand={demand}
                mode="tourist"
                bidCount={demand.bids?.[0]?.count ?? 0}
                href={`/demand/${demand.id}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
