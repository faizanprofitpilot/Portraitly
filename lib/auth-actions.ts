'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function checkAuthStatus() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('❌ Server auth check error:', error)
      return { user: null, error: error.message }
    }
    
    if (user) {
      console.log('✅ Server: User found:', user.email)
      return { user, error: null }
    }
    
    console.log('❌ Server: No authenticated user found')
    return { user: null, error: null }
  } catch (error) {
    console.log('❌ Server: Unexpected auth error:', error)
    return { user: null, error: 'Unexpected error' }
  }
}

export async function signOut() {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.log('❌ Sign out error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Sign out successful')
    return { success: true, error: null }
  } catch (error) {
    console.log('❌ Unexpected sign out error:', error)
    return { success: false, error: 'Unexpected error' }
  }
}
