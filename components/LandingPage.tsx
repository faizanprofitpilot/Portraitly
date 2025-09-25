'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Camera, ArrowRight, CheckCircle, Star, Shield, Zap, Users, Download, Sparkles, Play, LogOut, Crown, Award, Globe } from 'lucide-react'
import BackgroundPattern from './BackgroundPattern'
import BeforeAfterSlider from './BeforeAfterSlider'
import PricingSection from './PricingSection'

export default function LandingPage() {
  const [loading, setLoading] = useState(false)


  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      console.log('🔐 Starting OAuth flow...')
      
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) {
        console.error('OAuth error:', error)
        alert('Failed to sign in. Please try again.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      alert('Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Landing page render
  console.log('🎨 Landing page render')
  
  return (
    <div className="min-h-screen bg-premium-gradient relative overflow-hidden">
      {/* Background Pattern */}
      <BackgroundPattern />
      
      {/* FOMO Bar */}
      <div className="relative z-10 bg-gradient-to-r from-accent-turquoise to-accent-emerald text-magical-dark text-center py-3 text-sm font-medium">
        ✨ Join 1,000+ professionals upgrading their LinkedIn in minutes
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img 
              src="/images/Portraitly logo.png" 
              alt="Portraitly Logo" 
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold text-white">
              Portraitly
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Pricing
            </button>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="bg-cta-gradient text-magical-deep font-bold px-8 py-4 rounded-2xl hover:shadow-premium transition-all duration-200 flex items-center space-x-2 shadow-magical"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-magical-deep"></div>
              ) : (
                <>
                  <span>Try for Free</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Copy */}
            <div className="text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-white">
                Professional Headshots{' '}
                <span className="text-accent-turquoise">
                  in Seconds
                </span>
              </h1>
              
              <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-lg">
                Transform your casual selfies into professional headshots that preserve your identity. 
                Perfect for LinkedIn, resumes, and professional profiles.
              </p>

              <div className="flex justify-center mb-8">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="bg-gradient-to-r from-accent-turquoise to-accent-emerald text-white font-bold text-lg px-8 py-4 rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center justify-center space-x-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Crown className="h-5 w-5" />
                      <span>Try for Free</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-full">
                  <Shield className="h-4 w-4 text-accent-turquoise" />
                  <span className="text-white text-sm">Secure</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-accent-gold" />
                  <span className="text-white text-sm">No credit card</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-full">
                  <Zap className="h-4 w-4 text-accent-emerald" />
                  <span className="text-white text-sm">Cancel anytime</span>
                </div>
              </div>
            </div>

                    {/* Right Column - Before/After Slider */}
                    <div className="relative">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <BeforeAfterSlider 
                          beforeImage="/images/after.png"
                          afterImage="/images/before.jpeg"
                        />

                        <div className="mt-6 text-center">
                          <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
                            <Zap className="h-4 w-4 text-accent-turquoise" />
                            <span className="text-white text-sm">AI Magic in 30 seconds</span>
                          </div>
                        </div>
                      </div>
                    </div>
          </div>
        </div>
      </main>

      {/* Pricing */}
      <PricingSection />

      {/* How It Works */}
      <section className="px-6 py-16 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white/10 rounded-xl p-6">
              <div className="bg-gradient-to-br from-accent-turquoise to-accent-emerald w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">1. Upload Selfie</h3>
              <p className="text-gray-300">Snap a photo or upload from your phone. Any casual selfie works perfectly.</p>
            </div>
            
            <div className="text-center bg-white/10 rounded-xl p-6">
              <div className="bg-gradient-to-br from-accent-blue to-magical-teal w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">2. AI Magic</h3>
              <p className="text-gray-300">Portraitly creates professional, style-perfect shots that preserve your identity.</p>
            </div>
            
            <div className="text-center bg-white/10 rounded-xl p-6">
              <div className="bg-gradient-to-br from-accent-gold to-accent-emerald w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Download className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">3. Download & Share</h3>
              <p className="text-gray-300">Instantly use for LinkedIn, resumes, or press. High-res, no watermarks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiator Block */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/10 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Unlike other AI headshot tools,{' '}
              <span className="text-accent-turquoise">
                Portraitly preserves your true identity
              </span>
            </h2>
            
            <p className="text-lg text-gray-300 mb-6">
              No plastic skin. No random faces. Just the best version of you.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span className="text-white font-medium">Banana-consistent identity</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span className="text-white font-medium">Multiple styles (LinkedIn, Founder, Editorial)</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span className="text-white font-medium">High-resolution, no watermarks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-20 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Trusted by Professionals
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-white text-lg mb-4 italic">
                "These look better than the $300 photographer I hired. Perfect for my startup pitch deck."
              </p>
              <div className="text-gray-300">
                <p className="font-semibold">Sarah Chen</p>
                <p>Startup Founder</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-white text-lg mb-4 italic">
                "Perfect for my job hunt. Instant LinkedIn upgrade that got me 3x more profile views."
              </p>
              <div className="text-gray-300">
                <p className="font-semibold">Marcus Rodriguez</p>
                <p>Marketing Graduate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Simple, Transparent Pricing
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">Free Trial</h3>
              <div className="text-4xl font-bold text-white mb-4">10 Credits</div>
              <p className="text-gray-300 mb-6">Perfect to try Portraitly and see the magic</p>
              <ul className="text-left text-gray-300 space-y-2 mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>No credit card required</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>High-resolution downloads</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Multiple styles</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-accent-turquoise to-accent-emerald rounded-2xl p-8 border border-accent-turquoise/50">
              <h3 className="text-2xl font-bold text-white mb-4">Pro</h3>
              <div className="text-4xl font-bold text-white mb-4">$19/mo</div>
              <p className="text-white/90 mb-6">Unlimited professional headshots</p>
              <ul className="text-left text-white/90 space-y-2 mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-white" />
                  <span>Unlimited generations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-white" />
                  <span>Priority processing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-white" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
            </div>
          </div>
          
          <p className="text-gray-300 mt-8">
            Upgrade anytime. Cancel anytime. No hidden fees.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 bg-gradient-to-r from-magical-teal to-accent-turquoise">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Professional Image?
          </h2>
          <p className="text-lg text-white/90 mb-6">
            Join thousands of professionals who've upgraded their headshots in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="bg-white text-magical-dark font-bold text-lg px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center space-x-3 shadow-2xl"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-magical-dark"></div>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Start Your Free Trial</span>
                </>
              )}
            </button>
            <a
              href="/dashboard"
              className="border-2 border-white text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-white/10 transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <Play className="h-5 w-5" />
              <span>Try Demo First</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Portraitly</span>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                AI-powered professional headshots that preserve your identity. 
                Transform your casual selfies into LinkedIn-ready photos in minutes.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</a></li>
                <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-300 hover:text-white transition-colors">Pricing</button></li>
                <li><a href="/account" className="text-gray-300 hover:text-white transition-colors">Account</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="/legal/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/legal/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © 2024 Portraitly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
