import PricingSection from '@/components/PricingSection'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-premium-gradient">
      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Start with 10 free credits, then upgrade when you're ready for more.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <section className="px-6 py-20 bg-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                How many credits do I get with each plan?
              </h3>
              <p className="text-gray-300">
                Free users get 10 credits to start. Basic Plan includes 50 credits/month, 
                Pro Plan includes 200 credits/month, and Unlimited Plan has no limits.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-300">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time 
                through your billing portal. Changes take effect immediately.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                Do credits roll over to the next month?
              </h3>
              <p className="text-gray-300">
                Credits reset monthly on your billing date. Unused credits don't roll over, 
                but you can always purchase additional credits if needed.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                Are there any setup fees or contracts?
              </h3>
              <p className="text-gray-300">
                No setup fees, no contracts, no hidden charges. You only pay for what you use, 
                and you can cancel anytime with no penalties.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}