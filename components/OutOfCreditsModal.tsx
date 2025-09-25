'use client'

import { useState } from 'react'
import { Crown, Star, X, ArrowRight } from 'lucide-react'

interface OutOfCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgrade: () => void
}

export default function OutOfCreditsModal({ isOpen, onClose, onUpgrade }: OutOfCreditsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-accent-turquoise to-accent-emerald rounded-2xl flex items-center justify-center mb-6">
            <Crown className="h-8 w-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            You're Out of Credits!
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            You've used all your free credits. Upgrade to Pro to continue creating professional headshots.
          </p>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Pro Plan Benefits:</h3>
            <ul className="space-y-3 text-left">
              <li className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-accent-turquoise" />
                <span className="text-gray-700">200 AI headshots per month</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-accent-turquoise" />
                <span className="text-gray-700">All style options</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-accent-turquoise" />
                <span className="text-gray-700">High resolution downloads</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-accent-turquoise" />
                <span className="text-gray-700">Priority support</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-accent-turquoise" />
                <span className="text-gray-700">Commercial license</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-accent-turquoise to-accent-emerald text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
            >
              <Crown className="h-5 w-5" />
              <span>Upgrade to Pro - $19.99/month</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Fine Print */}
          <p className="text-xs text-gray-500 mt-4">
            Cancel anytime • No setup fees • 200 credits monthly
          </p>
        </div>
      </div>
    </div>
  )
}
