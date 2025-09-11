import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return <Dashboard user={user} />
}
