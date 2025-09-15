import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const origin = requestUrl.origin;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error in callback:', error);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, origin));
  }

  if (code) {
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    try {
      // Exchange code for session
      const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (authError) {
        console.error('Auth callback error:', authError);
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(authError.message)}`, origin));
      }

      if (!data.session || !data.user) {
        console.error('No session or user after code exchange');
        return NextResponse.redirect(new URL(`/?error=no_session_created`, origin));
      }

      // Successfully authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', origin));
    } catch (error) {
      console.error('Unexpected auth callback error:', error);
      return NextResponse.redirect(new URL(`/?error=unexpected_error`, origin));
    }
  }

  // No code, redirect to home
  return NextResponse.redirect(new URL('/', origin));
}
