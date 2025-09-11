'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, CreditCard, Download, LogOut, Settings, Crown } from 'lucide-react'
import Link from 'next/link'

interface UserData {
  id: string
  email: string
  plan: string
  credits_remaining: number
  created_at: string
}

export default function AccountPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isManagingSubscription, setIsManagingSubscription] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else if (response.status === 401) {
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true)
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setIsManagingSubscription(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Not authenticated</h1>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Go to homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            Portraitly
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/demo" className="text-white/80 hover:text-white transition-colors">
              Demo
            </Link>
            <Link href="/pricing" className="text-white/80 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/account" className="text-white font-medium">
              Account
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Account Dashboard</h1>
          <p className="text-gray-300">Manage your subscription and view your usage</p>
        </div>

        {/* Account Info */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* User Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Account Information</h2>
                <p className="text-gray-300">Your profile details</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-white">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Member since</label>
                <p className="text-white">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-full">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Current Plan</h2>
                <p className="text-gray-300">Your subscription details</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">
                  {user.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.plan === 'pro' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {user.plan === 'pro' ? 'Active' : 'Free'}
                </span>
              </div>
              {user.plan === 'free' && (
                <div>
                  <label className="text-sm text-gray-400">Credits remaining</label>
                  <p className="text-white text-2xl font-bold">{user.credits_remaining}</p>
                </div>
              )}
              {user.plan === 'pro' && (
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <p className="text-white">Unlimited generations</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          {user.plan === 'free' && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Upgrade to Pro
                  </h3>
                  <p className="text-gray-300">
                    Get unlimited AI-generated headshots for just $19/month
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>Upgrade Now</span>
                  <Crown className="h-5 w-5" />
                </Link>
              </div>
            </div>
          )}

          {user.plan === 'pro' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Manage Subscription
                  </h3>
                  <p className="text-gray-300">
                    Update your payment method or cancel your subscription
                  </p>
                </div>
                <button
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                  className="bg-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isManagingSubscription ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      <span>Manage</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Sign Out
                </h3>
                <p className="text-gray-300">
                  Sign out of your account
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500/20 text-red-400 font-bold px-6 py-3 rounded-xl hover:bg-red-500/30 transition-all duration-200 flex items-center space-x-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
