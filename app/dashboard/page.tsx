import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Demo from '@/components/Demo'

export default async function DashboardPage() {
  console.log('🎯 Dashboard page rendering')
  
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (!user || error) {
    console.log('❌ Dashboard: No authenticated user, redirecting to home')
    redirect('/')
  }
  
  console.log('✅ Dashboard: User authenticated:', user.email)
  return <Demo />
}