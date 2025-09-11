import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get the origin from the request
    const origin = request.nextUrl.origin;
    
    if (!user) {
      console.log('No user found in auth callback');
      return NextResponse.redirect(new URL("/", origin));
    }

    console.log('Auth callback - User found:', user.email);

    // Create or ensure users row exists
    const { data: existing, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing user:', selectError);
      return NextResponse.redirect(new URL("/?error=database_error", origin));
    }

    if (!existing) {
      console.log('Creating new user record for:', user.email);
      const { error: insertError } = await supabase.from("users").insert({
        auth_user_id: user.id,
        email: user.email!,
        plan: "free",
        credits_remaining: 10
      });

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.redirect(new URL("/?error=user_creation_failed", origin));
      }
      
      console.log('User created successfully');
    } else {
      console.log('User already exists');
    }

    return NextResponse.redirect(new URL("/demo", origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL("/?error=server_error", origin));
  }
}
