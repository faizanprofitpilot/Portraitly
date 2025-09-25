import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { planType, userId } = await request.json()
    
    console.log('🔍 Checkout API: Request received:', { planType, userId })
    
    if (!planType || !userId) {
      return NextResponse.json(
        { error: 'Plan type and user ID are required' },
        { status: 400 }
      )
    }

    const plan = STRIPE_CONFIG.plans[planType as keyof typeof STRIPE_CONFIG.plans]
    if (!plan) {
      console.error('❌ Checkout API: Invalid plan type:', planType)
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }
    
    console.log('✅ Checkout API: Plan found:', plan)

    // Get user from Supabase
    const supabase = createClient()
    
    // First get the auth user to get their email
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Then get user data by email (since auth_user_id column doesn't exist)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('email', authUser.email)
      .single()

    console.log('📊 Checkout API: User lookup result:', { user, userError: userError?.message })

    if (userError || !user) {
      console.error('❌ Checkout API: User not found:', userError?.message)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let customerId = user.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Update user with customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: STRIPE_CONFIG.successUrl,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_type: planType,
        },
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('❌ Stripe checkout error:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
