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
  
  // Check if user has a database record (same logic as home page)
  try {
    console.log('🔍 Dashboard: Checking user in database:', user.id, user.email)
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    
    console.log('📊 Dashboard: Database check result:', { userData, dbError })
    
    // If no database record, redirect to home (which will create the record)
    if (!userData || dbError) {
      console.log('❌ Dashboard: User not found in database, redirecting to home')
      redirect('/')
    }
    
    console.log('✅ Dashboard: User authenticated and has database record:', user.email)
    return <Demo />
  } catch (error) {
    console.error('❌ Dashboard: Error checking user in database:', error)
    redirect('/')
  }
}