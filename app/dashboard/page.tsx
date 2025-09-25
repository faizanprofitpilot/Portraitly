import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Demo from '@/components/Demo'

export default async function DashboardPage() {
  console.log('🎯 Dashboard page rendering')
  
  const supabase = createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('❌ Dashboard: Session error:', sessionError)
    redirect('/')
  }
  
  if (!session?.user) {
    console.log('❌ Dashboard: No authenticated session, redirecting to home')
    redirect('/')
  }
  
  console.log('✅ Dashboard: User authenticated:', session.user.email)
  
  // Check if user has a database record
  try {
    console.log('🔍 Dashboard: Checking user in database:', session.user.id, session.user.email)
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, auth_user_id, email, credits_remaining, plan, subscription_status')
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
        .select('id, auth_user_id, email, credits_remaining, plan, subscription_status')
        .single()

      if (!newUser || insertError) {
        console.log('❌ Dashboard: Failed to create user record:', insertError)
        // Don't redirect on error, just show dashboard with session user
        console.log('⚠️ Dashboard: Continuing with session user despite DB error')
        return <Demo />
      }
      
      console.log('✅ Dashboard: User record created:', newUser)
      return <Demo />
    }
    
    console.log('✅ Dashboard: User authenticated and has database record:', session.user.email)
    return <Demo />
  } catch (error) {
    console.error('❌ Dashboard: Error checking user in database:', error)
    // Don't redirect on error, just show dashboard with session user
    console.log('⚠️ Dashboard: Continuing with session user despite error')
    return <Demo />
  }
}