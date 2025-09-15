import Link from 'next/link'

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          <p className="text-gray-300 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 mb-6">
              By accessing and using Portraitly, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-300 mb-6">
              Portraitly is an AI-powered headshot generation service that transforms casual 
              selfies into professional headshots. We provide both free and paid tiers of service.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <p className="text-gray-300 mb-6">
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="text-gray-300 mb-6">
              You agree not to use the service for any unlawful purpose or any purpose prohibited 
              under this clause. You may not use the service in any manner that could damage, 
              disable, overburden, or impair any server, or the network(s) connected to any server.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">5. Content and Intellectual Property</h2>
            <p className="text-gray-300 mb-6">
              You retain ownership of any images you upload. By using our service, you grant us 
              a limited license to process your images for the purpose of generating headshots. 
              Generated images are provided to you for your personal or professional use.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">6. Payment Terms</h2>
            <p className="text-gray-300 mb-6">
              Paid subscriptions are billed monthly. All fees are non-refundable unless otherwise 
              stated. You may cancel your subscription at any time through your account settings.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-300 mb-6">
              In no event shall Portraitly, its officers, directors, employees, or agents be 
              liable to you for any direct, indirect, incidental, special, punitive, or 
              consequential damages whatsoever resulting from any errors, mistakes, or inaccuracies 
              of content.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">8. Termination</h2>
            <p className="text-gray-300 mb-6">
              We may terminate or suspend your account and bar access to the service immediately, 
              without prior notice or liability, under our sole discretion, for any reason whatsoever 
              and without limitation.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to Terms</h2>
            <p className="text-gray-300 mb-6">
              We reserve the right, at our sole discretion, to modify or replace these Terms at 
              any time. If a revision is material, we will provide at least 30 days notice prior 
              to any new terms taking effect.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Information</h2>
            <p className="text-gray-300 mb-6">
              If you have any questions about these Terms of Service, please contact us at 
              legal@portraitly.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
