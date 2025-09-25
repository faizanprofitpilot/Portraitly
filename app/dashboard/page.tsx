import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard'

export default async function DashboardPage() {
  console.log('🎯 Dashboard page rendering')
  
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    console.log('❌ Dashboard: No authenticated session, redirecting to home')
    redirect('/')
  }
  
  // Check if user has a database record (same logic as home page)
  try {
    console.log('🔍 Dashboard: Checking user in database:', session.user.id, session.user.email)
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single()
    
    console.log('📊 Dashboard: Database check result:', { userData, dbError })
    
    // If no database record, create it
    if (!userData || dbError) {
      console.log('🔧 Dashboard: User not found in database, creating record...')
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          auth_user_id: session.user.id,
          email: session.user.email,
          credits_remaining: 10,
          plan: 'free',
          subscription_status: 'free'
        })
        .select('id')
        .single()

      if (!newUser || insertError) {
        console.log('❌ Dashboard: Failed to create user record:', insertError)
        redirect('/')
      }
      
      console.log('✅ Dashboard: User record created')
    }
    
    console.log('✅ Dashboard: User authenticated and has database record:', session.user.email)
    return <Dashboard user={session.user} />
  } catch (error) {
    console.error('❌ Dashboard: Error checking user in database:', error)
    redirect('/')
  }
}