import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get the origin from the request
  const origin = request.nextUrl.origin;
  
  if (!user) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // Create or ensure users row exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("users").insert({
      auth_user_id: user.id,
      email: user.email!,
      plan: "free",
      credits_remaining: 10
    });
  }

  return NextResponse.redirect(new URL("/demo", origin));
}
