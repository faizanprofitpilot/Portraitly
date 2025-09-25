'use client'

import { useState } from 'react'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'

interface AIErrorModalProps {
  isOpen: boolean
  onClose: () => void
  onRetry: () => void
  error?: string
}

export default function AIErrorModal({ isOpen, onClose, onRetry }: AIErrorModalProps) {
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
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Generation Failed
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            We encountered an issue while generating your headshot. This can happen occasionally due to high demand or image processing issues.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRetry}
              className="flex-1 bg-gradient-to-r from-accent-turquoise to-accent-emerald text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-4">
            If the problem persists, try uploading a different image or contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
