import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { 
            cookieStore.set({ name, value, ...options }); 
          },
          remove(name: string, options: any) { 
            cookieStore.set({ name, value: '', ...options }); 
          },
        },
      }
    );

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear all cookies
    const response = NextResponse.json({ success: true });
    
    // Clear Supabase cookies
    response.cookies.set('sb-access-token', '', { expires: new Date(0) });
    response.cookies.set('sb-refresh-token', '', { expires: new Date(0) });
    
    return response;
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 });
  }
}
