import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { DashboardClient } from './DashboardClient'
import type { Demand } from '@/types'

export const revalidate = 0

export default async function TouristDashboard() {
  const t = await getTranslations('dashboard')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: demands } = await supabase
    .from('demands')
    .select(`*, bids!demand_id(count)`)
    .eq('tourist_id', user.id)
    .order('created_at', { ascending: false })

  const list = (demands ?? []) as (Demand & { bids: { count: number }[] })[]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-6">
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

        <DashboardClient demands={list} />
      </main>
    </div>
  )
}
