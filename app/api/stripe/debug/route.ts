import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
      STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID ? '✅ Set' : '❌ Missing',
      STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID ? '✅ Set' : '❌ Missing',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? '✅ Set' : '❌ Missing',
    }

    // Check if we can import Stripe
    let stripeStatus = '❌ Failed to import'
    try {
      const { stripe } = await import('@/lib/stripe')
      stripeStatus = '✅ Stripe imported successfully'
    } catch (error) {
      stripeStatus = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return NextResponse.json({
      environment: envCheck,
      stripe: stripeStatus,
      timestamp: new Date().toISOString(),
      success: true
    })
    
  } catch (error: any) {
    console.error('❌ Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
