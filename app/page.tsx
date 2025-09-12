import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Only redirect if user exists AND has a database record
  if (user) {
    try {
      console.log('🔍 Checking user in database:', user.id, user.email)
      const { data: userData, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      console.log('📊 Database check result:', { userData, error })
      
      // If user has a database record, redirect to dashboard
      if (userData && !error) {
        console.log('✅ User found in database, redirecting to dashboard')
        redirect('/dashboard')
      }
      // If no database record, clear the auth session and show landing page
      else {
        console.log('❌ User not found in database, clearing session')
        await supabase.auth.signOut()
      }
    } catch (error) {
      // If there's any error checking the database, clear auth and show landing page
      console.error('❌ Error checking user in database:', error)
      await supabase.auth.signOut()
    }
  }

  return <LandingPage />
}
