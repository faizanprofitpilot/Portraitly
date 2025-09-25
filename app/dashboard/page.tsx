import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Demo from '@/components/Demo'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session?.user) {
    redirect('/')
  }
  
  // Check if user has a database record
  try {
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, auth_user_id, email, credits_remaining, plan, subscription_status')
      .eq('auth_user_id', session.user.id)
      .single()
    
    // If no database record, create it
    if (!userData || dbError) {
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
        return <Demo />
      }
      
      return <Demo />
    }
    
    return <Demo />
  } catch (error) {
    return <Demo />
  }
}