import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            Portraitly
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-white/80 hover:text-white transition-colors">
              Demo
            </Link>
            <Link href="/pricing" className="text-white/80 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/account" className="text-white/80 hover:text-white transition-colors">
              Account
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          <p className="text-gray-300 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 mb-6">
              We collect information you provide directly to us, such as when you create an account, 
              upload images, or contact us for support. This may include your email address, 
              uploaded images, and usage data.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-300 mb-6">
              We use the information we collect to provide, maintain, and improve our services, 
              process your AI headshot generations, communicate with you, and ensure the security 
              of our platform.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">3. Image Processing</h2>
            <p className="text-gray-300 mb-6">
              When you upload images to our service, we process them using AI technology to 
              generate professional headshots. We do not store your original images permanently 
              and only retain generated images as specified in our terms of service.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
            <p className="text-gray-300 mb-6">
              We implement appropriate security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. However, 
              no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">5. Third-Party Services</h2>
            <p className="text-gray-300 mb-6">
              We use third-party services including Supabase for data storage and authentication, 
              Stripe for payment processing, and Google's Gemini AI for image generation. 
              These services have their own privacy policies.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="text-gray-300 mb-6">
              You have the right to access, update, or delete your personal information. 
              You can also opt out of certain communications from us. Contact us to exercise 
              these rights.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">7. Contact Us</h2>
            <p className="text-gray-300 mb-6">
              If you have any questions about this Privacy Policy, please contact us at 
              privacy@portraitly.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
