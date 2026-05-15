import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function VehicleSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  redirect(`/profile/driver/${user.id}`)
}
