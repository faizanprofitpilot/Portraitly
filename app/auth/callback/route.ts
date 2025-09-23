import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, requestUrl.origin))
  }

  if (code) {
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

    try {
      const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (authError) {
        console.error('Auth error:', authError)
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(authError.message)}`, requestUrl.origin))
      }

      if (!data.session || !data.user) {
        console.error('No session created')
        return NextResponse.redirect(new URL('/?error=no_session', requestUrl.origin))
      }

      // Redirect to home page to create database record first
      return NextResponse.redirect(new URL('/', requestUrl.origin))
      
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.redirect(new URL('/?error=unexpected', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin))
}