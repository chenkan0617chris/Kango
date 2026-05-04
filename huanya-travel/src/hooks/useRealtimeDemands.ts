'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Demand } from '@/types'

export function useRealtimeDemands(initial: Demand[] = []) {
  const [demands, setDemands] = useState<Demand[]>(initial)
  const supabase = createClient()

  const fetchDemand = useCallback(async (demandId: string) => {
    const { data } = await supabase
      .from('demands')
      .select(`
        *,
        tourist:profiles!tourist_id(id, full_name, avatar_url, rating, total_trips),
        bids(count)
      `)
      .eq('id', demandId)
      .single()

    if (data) {
      setDemands(prev => {
        const exists = prev.find(d => d.id === data.id)
        return exists ? prev : [data as Demand, ...prev]
      })
    }
  }, [supabase])

  useEffect(() => {
    // NOTE: enable Realtime for `demands` and `bids` tables in
    // Supabase Dashboard → Database → Replication
    const channel = supabase
      .channel('marketplace-demands')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'demands' },
        payload => { fetchDemand(payload.new.id as string) }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'demands' },
        payload => {
          setDemands(prev =>
            prev.map(d => d.id === payload.new.id ? { ...d, ...payload.new } as Demand : d)
          )
        }
      )
      // Track new bids → update bid count on demand card
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids' },
        payload => {
          const demandId = payload.new.demand_id as string
          setDemands(prev =>
            prev.map(d => {
              if (d.id !== demandId) return d
              const currentCount = (d.bids as unknown as { count: number }[])?.[0]?.count ?? 0
              return { ...d, bids: [{ count: currentCount + 1 }] as unknown as typeof d.bids }
            })
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchDemand, supabase])

  return { demands, setDemands }
}
