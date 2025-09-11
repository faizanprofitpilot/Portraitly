import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/auth";

export async function GET() {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL!));
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

  return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL!));
}
