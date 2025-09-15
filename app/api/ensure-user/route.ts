import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Ensure-user API called')
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
    console.log('👤 Auth check:', { user: user?.id, error: authError?.message })
    
    if (authError || !user) {
      console.log('❌ Not authenticated')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user data from database (user should be created by trigger)
    console.log('🔍 Checking user in database for auth_user_id:', user.id)
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email, plan, credits_remaining')
      .eq('auth_user_id', user.id)
      .single()
    
    console.log('📊 Database query result:', { userData, dbError: dbError?.message })
    
    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: dbError.message },
        { status: 500 }
      )
    }
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: userData
    })
    
  } catch (error) {
    console.error('Ensure user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
