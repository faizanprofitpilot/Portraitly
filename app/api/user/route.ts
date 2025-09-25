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

    // Get user data from database - try both old and new schema
    console.log('🔍 User API: Looking up user in database for auth_user_id:', user.id)
    
    // First try with new schema (credits_remaining)
    let { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email, credits_remaining, plan, subscription_status, subscription_plan, stripe_customer_id')
      .eq('auth_user_id', user.id)
      .single()
    
    // If that fails, try with old schema (credits)
    if (dbError && dbError.message.includes('credits_remaining')) {
      console.log('🔄 User API: Trying old schema with credits column')
      const { data: oldUserData, error: oldDbError } = await supabase
        .from('users')
        .select('id, email, credits, plan')
        .eq('auth_user_id', user.id)
        .single()
      
      if (oldUserData) {
        // Convert old schema to new schema
        userData = {
          ...oldUserData,
          credits_remaining: oldUserData.credits,
          subscription_status: 'free',
          subscription_plan: null,
          stripe_customer_id: null
        }
        dbError = null
        console.log('✅ User API: Converted old schema to new schema')
      } else {
        dbError = oldDbError
      }
    }
    
    console.log('📊 User API: Database query result:', { userData, dbError: dbError?.message })

    if (dbError) {
      // User doesn't exist in database, create them
      console.log('🔧 User API: User not found, creating new user record')
      
      // Try creating with new schema first
      let { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          credits_remaining: 10,
          plan: 'free',
          subscription_status: 'free'
        })
        .select('id, email, credits_remaining, plan, subscription_status, subscription_plan, stripe_customer_id')
        .single()

      // If that fails, try with old schema
      if (insertError && insertError.message.includes('credits_remaining')) {
        console.log('🔄 User API: Trying to create user with old schema')
        const { data: oldNewUser, error: oldInsertError } = await supabase
          .from('users')
          .insert({
            auth_user_id: user.id,
            email: user.email,
            credits: 10,
            plan: 'free'
          })
          .select('id, email, credits, plan')
          .single()
        
        if (oldNewUser) {
          // Convert to new schema format
          newUser = {
            ...oldNewUser,
            credits_remaining: oldNewUser.credits,
            subscription_status: 'free',
            subscription_plan: null,
            stripe_customer_id: null
          }
          insertError = null
          console.log('✅ User API: Created user with old schema, converted to new format')
        } else {
          insertError = oldInsertError
        }
      }

      console.log('📊 User API: User creation result:', { newUser, insertError: insertError?.message })

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create user', details: insertError.message },
          { status: 500 }
        )
      }

      console.log('✅ User API: User created successfully:', newUser.email)
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
