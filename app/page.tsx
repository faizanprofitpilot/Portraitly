import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  console.log('🏠 Home page rendering')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  console.log('🏠 Home page: User check result:', { user: !!user, email: user?.email })

  // Only redirect if user exists AND has a database record
  if (user) {
    try {
      console.log('🔍 Checking user in database:', user.id, user.email)
      const { data: userData, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()
      
      console.log('📊 Database check result:', { userData, error })
      
      // If user has a database record, redirect to dashboard
      if (userData && !error) {
        console.log('✅ User found in database, redirecting to dashboard')
        redirect('/dashboard')
      }
      // If no database record, create it directly
      else {
        console.log('🔧 User not found in database, creating user record...')
        
        // Create user record directly
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            email: user.email,
            credits: 10,
            plan: 'free'
          })
          .select('id')
          .single()

        if (newUser && !insertError) {
          console.log('✅ User record created, redirecting to dashboard')
          redirect('/dashboard')
        } else {
          console.log('❌ Failed to create user record:', insertError)
          await supabase.auth.signOut()
        }
      }
    } catch (error) {
      // If there's any error, clear auth and show landing page
      console.error('❌ Error checking/creating user in database:', error)
      await supabase.auth.signOut()
    }
  }

  console.log('🏠 Home page: No authenticated user, showing landing page')
  return <LandingPage />
}
