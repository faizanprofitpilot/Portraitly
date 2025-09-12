import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

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
        { error: 'Failed to ensure user exists', details: error.message },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'No user data returned' },
        { status: 500 }
      )
    }
    
    // Handle both array and object responses
    const userData = Array.isArray(data) ? data[0] : data
    
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
