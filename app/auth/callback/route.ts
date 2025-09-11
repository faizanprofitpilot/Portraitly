import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    // Get the origin from the request
    const origin = request.nextUrl.origin;
    
    // Create a service role client that bypasses RLS
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Also create regular client for auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user found in auth callback');
      return NextResponse.redirect(new URL("/", origin));
    }

    console.log('Auth callback - User found:', user.email);

    // Check if user exists using service role (bypasses RLS)
    const { data: existing, error: selectError } = await supabaseService
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
      // Use service role to insert user (bypasses RLS)
      const { error: insertError } = await supabaseService.from("users").insert({
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
