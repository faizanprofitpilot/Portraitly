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
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user data from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email, credits, plan')
      .eq('email', user.email)
      .single()

    if (dbError) {
      // User doesn't exist in database, create them
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: user.email,
          credits: 10,
          plan: 'free'
        })
        .select('id, email, credits, plan')
        .single()

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create user', details: insertError.message },
          { status: 500 }
        )
      }

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
