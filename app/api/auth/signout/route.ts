import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/auth";

export async function POST() {
  try {
    const supabase = getServerSupabase();
    await supabase.auth.signOut();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
