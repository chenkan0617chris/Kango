'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bid } from '@/types'

export function useRealtimeBids(demandId: string, initial: Bid[] = []) {
  const [bids, setBids] = useState<Bid[]>(initial)
  const supabase = createClient()

  const fetchBid = useCallback(async (bidId: string) => {
    const { data } = await supabase
      .from('bids')
      .select(`
        *,
        driver:profiles!driver_id(id, full_name, avatar_url, rating, total_trips, vehicle_type, is_verified, bio)
      `)
      .eq('id', bidId)
      .single()
    if (data) setBids(prev => {
      const exists = prev.find(b => b.id === data.id)
      return exists ? prev : [data as Bid, ...prev]
    })
  }, [supabase])

  useEffect(() => {
    // NOTE: enable Realtime for the `bids` table in
    // Supabase Dashboard → Database → Replication → bids ✓
    const channel = supabase
      .channel(`bids-demand-${demandId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `demand_id=eq.${demandId}` },
        payload => { fetchBid(payload.new.id as string) }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bids', filter: `demand_id=eq.${demandId}` },
        payload => {
          setBids(prev => prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } as Bid : b))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [demandId, fetchBid, supabase])

  return { bids, setBids }
}
