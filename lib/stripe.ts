import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
})

export const STRIPE_CONFIG = {
  // Subscription plans
  plans: {
    pro: {
      name: 'Pro Plan', 
      priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      credits: 200,
      price: 19.99,
      interval: 'month',
      description: '200 AI headshots per month'
    }
  },
  
  // Webhook endpoint secret
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Success/cancel URLs
  successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?payment=cancelled`,
  
  // Billing portal return URL
  billingPortalReturnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?tab=billing`,
}

export type PlanType = keyof typeof STRIPE_CONFIG.plans
