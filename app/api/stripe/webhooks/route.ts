import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature || !STRIPE_CONFIG.webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: any, supabase: any) {
  const userId = session.metadata?.user_id
  const planType = session.metadata?.plan_type

  if (!userId || !planType) {
    console.error('Missing user_id or plan_type in checkout session')
    return
  }

  const plan = STRIPE_CONFIG.plans[planType as keyof typeof STRIPE_CONFIG.plans]
  if (!plan) {
    console.error('Invalid plan type:', planType)
    return
  }

  // Get user email from Stripe customer
  const customer = await stripe.customers.retrieve(session.customer)
  
  if (customer.deleted || !customer.email) {
    console.error('No email found for customer:', session.customer)
    return
  }
  
  const userEmail = customer.email

  // Update user subscription status by email (since auth_user_id column doesn't exist)
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_plan: planType,
      credits: plan.credits, // Pro plan gets 200 credits
      subscription_id: session.subscription,
      stripe_customer_id: session.customer,
    })
    .eq('email', userEmail)

  if (error) {
    console.error('Error updating user subscription:', error)
    return
  }

  console.log(`✅ Checkout completed for user ${userEmail}, plan: ${planType}`)
}

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  const userId = subscription.metadata?.user_id
  const planType = subscription.metadata?.plan_type

  if (!userId || !planType) {
    console.error('Missing user_id or plan_type in subscription')
    return
  }

  const plan = STRIPE_CONFIG.plans[planType as keyof typeof STRIPE_CONFIG.plans]
  if (!plan) {
    console.error('Invalid plan type:', planType)
    return
  }

  // Get user email from Stripe customer
  const customer = await stripe.customers.retrieve(subscription.customer)
  
  if (customer.deleted || !customer.email) {
    console.error('No email found for customer:', subscription.customer)
    return
  }
  
  const userEmail = customer.email

  // Update user subscription based on status
  const subscriptionStatus = subscription.status === 'active' ? 'active' : 'inactive'
  
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: subscriptionStatus,
      subscription_plan: planType,
      credits: plan.credits, // Pro plan gets 200 credits
      subscription_id: subscription.id,
    })
    .eq('email', userEmail)

  if (error) {
    console.error('Error updating subscription:', error)
    return
  }

  console.log(`✅ Subscription updated for user ${userEmail}, status: ${subscriptionStatus}`)
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription')
    return
  }

  // Get user email from Stripe customer
  const customer = await stripe.customers.retrieve(subscription.customer)
  
  if (customer.deleted || !customer.email) {
    console.error('No email found for customer:', subscription.customer)
    return
  }
  
  const userEmail = customer.email

  // Reset user to free tier
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      subscription_plan: null,
      credits: 10, // Reset to free tier
      subscription_id: null,
    })
    .eq('email', userEmail)

  if (error) {
    console.error('Error cancelling subscription:', error)
    return
  }

  console.log(`✅ Subscription cancelled for user ${userEmail}`)
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
  const userId = subscription.metadata?.user_id
  const planType = subscription.metadata?.plan_type

  if (!userId || !planType) {
    console.error('Missing user_id or plan_type in invoice')
    return
  }

  const plan = STRIPE_CONFIG.plans[planType as keyof typeof STRIPE_CONFIG.plans]
  if (!plan) {
    console.error('Invalid plan type:', planType)
    return
  }

  // Get user email from Stripe customer
  const customer = await stripe.customers.retrieve(subscription.customer)
  
  if (customer.deleted || !customer.email) {
    console.error('No email found for customer:', subscription.customer)
    return
  }
  
  const userEmail = customer.email

  // Refill credits for the new billing period
  const { error } = await supabase
    .from('users')
    .update({
      credits: plan.credits, // Pro plan gets 200 credits
      last_payment_date: new Date().toISOString(),
    })
    .eq('email', userEmail)

  if (error) {
    console.error('Error refilling credits:', error)
    return
  }

  console.log(`✅ Payment succeeded for user ${userEmail}, credits refilled`)
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in invoice')
    return
  }

  // Get user email from Stripe customer
  const customer = await stripe.customers.retrieve(subscription.customer)
  
  if (customer.deleted || !customer.email) {
    console.error('No email found for customer:', subscription.customer)
    return
  }
  
  const userEmail = customer.email

  // Mark subscription as past due
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
    })
    .eq('email', userEmail)

  if (error) {
    console.error('Error marking subscription as past due:', error)
    return
  }

  console.log(`❌ Payment failed for user ${userEmail}`)
}
