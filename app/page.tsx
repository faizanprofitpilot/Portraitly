import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/LandingPage'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // If user has a session, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  // No session, show landing page
  return <LandingPage />
}
