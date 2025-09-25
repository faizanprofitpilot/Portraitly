'use client'

import { useState } from 'react'
import { CreditCard, Crown, Zap, Star, ExternalLink, CheckCircle } from 'lucide-react'

interface BillingManagementProps {
  user: {
    id: string
    subscription_status?: string
    subscription_plan?: string
    credits?: number
    stripe_customer_id?: string
  }
}

export default function BillingManagement({ user }: BillingManagementProps) {
  const [loading, setLoading] = useState(false)

  const handleBillingPortal = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const { url, error } = await response.json()
      
      if (error) {
        throw new Error(error)
      }

      window.open(url, '_blank')
    } catch (error) {
      console.error('Billing portal error:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPlanIcon = (plan?: string) => {
    switch (plan) {
      case 'basic':
        return <Zap className="h-5 w-5" />
      case 'pro':
        return <Star className="h-5 w-5" />
      case 'unlimited':
        return <Crown className="h-5 w-5" />
      default:
        return <CheckCircle className="h-5 w-5" />
    }
  }

  const getPlanName = (plan?: string) => {
    switch (plan) {
      case 'basic':
        return 'Basic Plan'
      case 'pro':
        return 'Pro Plan'
      case 'unlimited':
        return 'Unlimited Plan'
      default:
        return 'Free Plan'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'text-accent-emerald'
      case 'past_due':
        return 'text-accent-gold'
      case 'cancelled':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
      <div className="flex items-center space-x-3 mb-6">
        <CreditCard className="h-6 w-6 text-accent-turquoise" />
        <h2 className="text-2xl font-bold text-white">Billing & Subscription</h2>
      </div>

      {/* Current Plan */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Current Plan</h3>
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent-turquoise/20 rounded-xl">
                {getPlanIcon(user.subscription_plan)}
              </div>
              <div>
                <h4 className="text-white font-semibold">
                  {getPlanName(user.subscription_plan)}
                </h4>
                <p className={`text-sm ${getStatusColor(user.subscription_status)}`}>
                  {user.subscription_status || 'Free'} • {user.credits === -1 ? 'Unlimited' : user.credits || 10} credits
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">
                {user.credits === -1 ? 'Unlimited' : user.credits || 10} credits
              </p>
              <p className="text-gray-400 text-sm">remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Actions */}
      <div className="space-y-4">
        <button
          onClick={handleBillingPortal}
          disabled={loading || !user.stripe_customer_id}
          className="w-full bg-accent-turquoise hover:bg-accent-turquoise/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>Manage Billing</span>
              <ExternalLink className="h-5 w-5" />
            </>
          )}
        </button>

        {!user.stripe_customer_id && (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              Upgrade to a paid plan to access billing management
            </p>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl font-semibold transition-all duration-300"
            >
              View Plans
            </button>
          </div>
        )}
      </div>

      {/* Billing Info */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h4 className="text-white font-semibold mb-3">Billing Information</h4>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• Billing is handled securely through Stripe</p>
          <p>• Cancel or change your plan anytime</p>
          <p>• Credits reset monthly on your billing date</p>
          <p>• All plans include commercial usage rights</p>
        </div>
      </div>
    </div>
  )
}
