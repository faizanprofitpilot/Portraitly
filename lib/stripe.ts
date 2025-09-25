import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export const STRIPE_CONFIG = {
  // Subscription plans
  plans: {
    basic: {
      name: 'Basic Plan',
      priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_monthly',
      credits: 50,
      price: 9.99,
      interval: 'month',
      description: '50 AI headshots per month'
    },
    pro: {
      name: 'Pro Plan', 
      priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      credits: 200,
      price: 19.99,
      interval: 'month',
      description: '200 AI headshots per month'
    },
    unlimited: {
      name: 'Unlimited Plan',
      priceId: process.env.STRIPE_UNLIMITED_PRICE_ID || 'price_unlimited_monthly',
      credits: -1, // -1 means unlimited
      price: 39.99,
      interval: 'month',
      description: 'Unlimited AI headshots'
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
