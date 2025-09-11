import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/auth";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
