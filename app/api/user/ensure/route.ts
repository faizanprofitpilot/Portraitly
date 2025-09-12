import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Call the RPC function to ensure user exists
    const { data, error } = await supabase.rpc('ensure_user_exists')
    
    if (error) {
      console.error('RPC error:', error)
      return NextResponse.json(
        { error: 'Failed to ensure user exists' },
        { status: 500 }
      )
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No user data returned' },
        { status: 500 }
      )
    }
    
    const userData = data[0]
    
    return NextResponse.json({
      success: true,
      user: {
        id: userData.user_id,
        email: userData.email,
        plan: userData.plan,
        credits_remaining: userData.credits_remaining
      }
    })
    
  } catch (error) {
    console.error('Ensure user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
