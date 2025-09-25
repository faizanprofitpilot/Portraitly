'use client'

import { useState } from 'react'
import { Check, Crown, Zap, Star, ArrowRight } from 'lucide-react'
import { redirectToCheckout } from '@/lib/stripe-client'

interface PricingSectionProps {
  userId?: string
  currentPlan?: string
}

export default function PricingSection({ userId, currentPlan }: PricingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '',
      credits: 10,
      description: 'Try Portraitly for free',
      features: [
        '10 AI headshots to start',
        'All style options',
        'High resolution downloads',
        'Perfect for testing'
      ],
      popular: false,
      icon: CheckCircle,
      isFree: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19.99',
      period: '/month',
      credits: 200,
      description: 'Perfect for professionals',
      features: [
        '200 AI headshots per month',
        'All style options',
        'High resolution downloads',
        'Priority support',
        'Commercial license',
        'Cancel anytime'
      ],
      popular: true,
      icon: Crown,
      isFree: false,
    },
  ]

  const handleSubscribe = async (planId: string) => {
    if (!userId) {
      // Redirect to sign in
      window.location.href = '/auth'
      return
    }

    // Handle free plan - just redirect to dashboard
    if (planId === 'free') {
      window.location.href = '/dashboard'
      return
    }

    setLoading(planId)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: planId,
          userId: userId,
        }),
      })

      const { sessionId, error } = await response.json()
      
      if (error) {
        throw new Error(error)
      }

      await redirectToCheckout(sessionId)
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section className="py-20 bg-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include our premium AI technology.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = currentPlan === plan.id
            const isLoading = loading === plan.id
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'border-accent-turquoise shadow-2xl shadow-accent-turquoise/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-accent-turquoise text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-accent-gold text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Current Plan
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-2xl ${
                      plan.popular ? 'bg-accent-turquoise/20' : 'bg-white/10'
                    }`}>
                      <Icon className={`h-8 w-8 ${
                        plan.popular ? 'text-accent-turquoise' : 'text-white'
                      }`} />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-300 mb-4">{plan.description}</p>
                  
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-300 ml-1">{plan.period}</span>
                  </div>
                  
                  <p className="text-accent-turquoise font-semibold mt-2">
                    {plan.credits === -1 ? 'Unlimited' : `${plan.credits}`} headshots
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-accent-emerald flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || isLoading}
                  className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                    isCurrentPlan
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-accent-turquoise hover:bg-accent-turquoise/90 text-white'
                      : plan.isFree
                      ? 'bg-white/20 hover:bg-white/30 text-white border border-white/40'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : isCurrentPlan ? (
                    <span>Current Plan</span>
                  ) : plan.isFree ? (
                    <>
                      <span>Start Free</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      <span>Get Started</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Free Trial Info */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-white/10 px-6 py-3 rounded-full">
            <Check className="h-5 w-5 text-accent-emerald" />
            <span className="text-white font-semibold">
              Start with 10 free credits • Cancel anytime • No setup fees
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
