import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/auth";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const supabase = getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!userData?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
    }

    // Create Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
