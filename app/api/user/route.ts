import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookies().get(name)?.value,
          set: (name: string, value: string, options: any) => {
            cookies().set({ name, value, ...options })
          },
          remove: (name: string, options: any) => {
            cookies().set({ name, value: '', ...options })
          }
        }
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 User API: Auth check:', { user: user?.id, error: authError?.message })
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user data from database - look up by email since auth_user_id doesn't exist
    console.log('🔍 User API: Looking up user in database by email:', user.email)
    
    // Look up by email since auth_user_id column doesn't exist
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email, credits, plan, subscription_status, subscription_plan, stripe_customer_id, last_payment_date')
      .eq('email', user.email)
      .single()
    
    console.log('📊 User API: Database query result:', { userData, dbError: dbError?.message })

    if (dbError) {
      // User doesn't exist in database, create them
      console.log('🔧 User API: User not found, creating new user record')
      
      // Create user with the actual schema (credits, not credits_remaining)
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: user.email,
          credits: 10,
          plan: 'free',
          subscription_status: 'free'
        })
        .select('id, email, credits, plan, subscription_status, subscription_plan, stripe_customer_id, last_payment_date')
        .single()

      console.log('📊 User API: User creation result:', { newUser, insertError: insertError?.message })

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create user', details: insertError.message },
          { status: 500 }
        )
      }

      console.log('✅ User API: User created successfully:', newUser?.email)
      return NextResponse.json({ success: true, user: newUser })
    }

    return NextResponse.json({ success: true, user: userData })
    
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
