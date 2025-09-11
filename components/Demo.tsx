'use client'

import { useState, useEffect } from 'react'
import { Camera, Download, ArrowLeft, Sparkles, Image as ImageIcon, CheckCircle, X, Maximize2, Smartphone } from 'lucide-react'
import Link from 'next/link'
import MobileUploadModal from './MobileUploadModal'
import { createClient } from '@/lib/supabase/client'

const STYLE_OPTIONS = [
  { id: 'professional', name: 'Professional', description: 'Clean, corporate look perfect for LinkedIn' },
  { id: 'finance', name: 'Finance', description: 'Conservative, trustworthy appearance for banking' },
  { id: 'tech', name: 'Tech', description: 'Modern, innovative look for startups' },
  { id: 'creative', name: 'Creative', description: 'Artistic, expressive style for designers' },
  { id: 'executive', name: 'Executive', description: 'Authoritative, leadership presence' },
  { id: 'editorial', name: 'Editorial', description: 'Magazine-quality, editorial style' }
]

export default function Demo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedStyle, setSelectedStyle] = useState('professional')
  const [uploading, setUploading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [credits, setCredits] = useState(0) // Will be fetched from database
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMobileUpload, setShowMobileUpload] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [user, setUser] = useState<any>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const supabase = createClient()

  // Check authentication and create/ensure user exists
  useEffect(() => {
    const checkAuthAndCreateUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          
          // Check if user exists in database, create if not
          try {
            const { data: existingUser } = await supabase
              .from('users')
              .select('credits_remaining')
              .eq('auth_user_id', user.id)
              .single()
            
            if (existingUser) {
              // User exists, set their credits
              setCredits(existingUser.credits_remaining)
            } else {
              // User doesn't exist, create them
              console.log('Creating new user in database:', user.email)
              const { error: insertError } = await supabase
                .from('users')
                .insert({
                  auth_user_id: user.id,
                  email: user.email!,
                  plan: 'free',
                  credits_remaining: 10
                })
              
              if (insertError) {
                console.error('Error creating user:', insertError)
                // Still continue with demo credits
                setCredits(10)
              } else {
                console.log('User created successfully')
                setCredits(10)
              }
            }
          } catch (error) {
            console.error('Error with user database operations:', error)
            // Fallback to demo credits
            setCredits(10)
          }
          
          setIsLoadingAuth(false)
        } else {
          setIsLoadingAuth(false)
          // Give a moment for auth to initialize after OAuth redirect
          setTimeout(() => {
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (!user) {
                window.location.href = '/'
              }
            })
          }, 3000)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsLoadingAuth(false)
      }
    }
    
    checkAuthAndCreateUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        // Trigger user creation check
        checkAuthAndCreateUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        window.location.href = '/'
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Generate session ID on component mount
  useEffect(() => {
    const newSessionId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
  }, [])

  // Poll for mobile uploads
  useEffect(() => {
    if (!sessionId) return

    const pollForUploads = () => {
      try {
        const completedUploads = JSON.parse(
          localStorage.getItem(`mobileUploads_${sessionId}`) || '[]'
        )
        
        if (completedUploads.length > 0) {
          // Process the first uploaded file
          const uploadedFile = completedUploads[0]
          const imageUrl = `/uploads/${uploadedFile.filename}`
          
          // Create a File object from the uploaded image
          fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
              const file = new File([blob], uploadedFile.originalName, { type: 'image/jpeg' })
              setSelectedFile(file)
              setPreviewUrl(imageUrl)
              setOriginalImageUrl(imageUrl)
              
              // Clear processed uploads
              localStorage.removeItem(`mobileUploads_${sessionId}`)
            })
            .catch(error => {
              console.error('Error loading mobile upload:', error)
            })
        }
      } catch (error) {
        console.error('Error polling for uploads:', error)
      }
    }

    const interval = setInterval(pollForUploads, 2000)
    return () => clearInterval(interval)
  }, [sessionId])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview URL for the uploaded image
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setOriginalImageUrl(url) // Store original image URL separately
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile || credits === 0) return

    console.log('🎯 Starting Gemini 2.5 Flash generation with style:', selectedStyle)
    console.log('📁 Selected file:', selectedFile.name)

    setUploading(true)
    try {
      // Convert file to base64 for API
      const base64 = await fileToBase64(selectedFile)
      
      // Create the prompt based on selected style
      const stylePrompt = getStylePrompt(selectedStyle)
      
      console.log('🤖 Calling Gemini 2.5 Flash API...')
      console.log('📝 Prompt:', stylePrompt)
      
      // Call Gemini 2.5 Flash API
      const response = await fetch('/api/generate-headshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          style: selectedStyle,
          isDemo: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 402 && errorData.requiresUpgrade) {
          alert('No credits remaining! Please sign up for unlimited generations.')
          return
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Gemini API response:', result)

      if (result.url) {
        console.log('✅ Generated image URL received:', result.url.substring(0, 100) + '...')
        setGeneratedImage(result.url)
        
        // Refresh credits from database after generation
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('credits_remaining')
            .eq('auth_user_id', user.id)
            .single()
          
          if (userData) {
            setCredits(userData.credits_remaining)
          }
        } catch (error) {
          console.error('Error refreshing credits:', error)
        }
        
        setSelectedFile(null)
        setPreviewUrl(null)

        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        // Scroll to the generated image section
        setTimeout(() => {
          const outputSection = document.getElementById('generated-output')
          if (outputSection) {
            outputSection.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            })
          }
        }, 100)
      } else {
        throw new Error('No generated image returned')
      }

    } catch (error) {
      console.error('❌ Error generating with Gemini:', error)
      alert('Failed to generate headshot with AI. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  // Get style-specific prompt for Gemini
  const getStylePrompt = (style: string): string => {
    const basePrompt = "Transform this casual selfie into a professional headshot. Keep the person's face and identity exactly the same, but change their clothing and background to be professional. "
    
    switch (style) {
      case 'professional':
        return basePrompt + "Dress them in a clean, modern business suit with a white dress shirt and professional tie. Use a clean, neutral background. Professional corporate headshot style."
      
      case 'finance':
        return basePrompt + "Dress them in a conservative dark suit (navy or charcoal) with a white dress shirt and professional tie. Use a clean, neutral background. Conservative banking/finance professional style."
      
      case 'tech':
        return basePrompt + "Dress them in a modern business casual outfit - blazer with dress shirt (no tie). Use a clean, modern background. Tech startup professional style."
      
      case 'creative':
        return basePrompt + "Dress them in a stylish, modern business outfit - blazer with interesting shirt or top. Use a clean, artistic background. Creative professional style."
      
      case 'executive':
        return basePrompt + "Dress them in a high-end executive suit with white dress shirt and tie. Use a clean, professional background. C-suite executive style."
      
      case 'editorial':
        return basePrompt + "Dress them in a sophisticated business outfit. Use a clean, editorial-style background. Magazine-quality professional headshot."
      
      default:
        return basePrompt + "Dress them in a professional business suit. Use a clean, neutral background."
    }
  }

  // Helper function to get clothing colors based on style
  const getClothingColor = (style: string) => {
    switch (style) {
      case 'professional':
        return '#2c3e50' // Dark blue
      case 'finance':
        return '#34495e' // Charcoal
      case 'tech':
        return '#3498db' // Blue
      case 'creative':
        return '#e74c3c' // Red
      case 'executive':
        return '#1a252f' // Very dark
      case 'editorial':
        return '#2c3e50' // Dark blue
      default:
        return '#2c3e50'
    }
  }

  // Helper function to get tie colors
  const getTieColor = (style: string) => {
    switch (style) {
      case 'professional':
        return '#c0392b' // Red
      case 'finance':
        return '#7f8c8d' // Gray
      case 'executive':
        return '#059669' // Emerald
      default:
        return '#c0392b'
    }
  }

  // Show loading state while checking authentication
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-magical-dark via-magical-deep to-magical-teal flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-magical-dark via-magical-deep to-magical-teal">
      {/* Header */}
      <header className="px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 text-white hover:text-gray-300 transition-colors">
            <ArrowLeft className="h-6 w-6" />
            <span className="text-lg font-medium">Back to Home</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                {credits} free credits remaining
              </span>
            </div>
            {user && (
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-sm text-white/80">
                  Welcome, {user.email?.split('@')[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Demo Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-6">
            Welcome to Portraitly{' '}
            <span className="bg-gradient-to-r from-accent-turquoise to-accent-emerald bg-clip-text text-transparent">
              Free
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your selfies into professional headshots with AI. Upload a photo and see the magic!
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-white/30 rounded-2xl p-8 text-center">
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="space-y-6">
                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden shadow-2xl">
                      <img
                        src={previewUrl}
                        alt="Uploaded selfie"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white mb-1">
                        {selectedFile?.name}
                      </p>
                      <p className="text-sm text-gray-300">
                        {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="h-16 w-16 text-white/60 mx-auto mb-4" />
                    <p className="text-xl font-medium text-white mb-2">
                      Choose a selfie to upload
                    </p>
                    <p className="text-sm text-gray-300">
                      PNG, JPG, or JPEG up to 10MB
                    </p>
                  </div>
                )}
                
                <div className="flex gap-4 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="bg-white/20 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-200 cursor-pointer border border-white/20"
                  >
                    {previewUrl ? 'Change Photo' : 'Choose File'}
                  </label>
                  
                  <button
                    onClick={() => setShowMobileUpload(true)}
                    className="bg-gradient-to-r from-accent-turquoise to-accent-emerald text-white font-semibold px-6 py-3 rounded-xl hover:from-accent-turquoise/90 hover:to-accent-emerald/90 transition-all duration-200 flex items-center gap-2 shadow-lg"
                  >
                    <Smartphone className="h-4 w-4" />
                    Upload from Phone
                  </button>
                </div>
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Choose Your Style</h3>
                <p className="text-gray-300 mb-6">
                  Select the professional look that best fits your industry
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left backdrop-blur-sm ${
                      selectedStyle === style.id
                        ? 'border-accent-turquoise bg-accent-turquoise/20 shadow-lg'
                        : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="font-semibold text-white mb-1">{style.name}</div>
                    <div className="text-xs text-gray-300">{style.description}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!selectedFile || credits === 0 || uploading}
                className="w-full bg-gradient-to-r from-accent-turquoise to-accent-emerald text-white font-bold px-8 py-4 rounded-xl hover:from-accent-turquoise/90 hover:to-accent-emerald/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-2xl"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name} Headshot...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    <span>Generate {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name} Headshot</span>
                  </>
                )}
              </button>
              
              {credits === 0 && (
                <p className="text-red-400 text-sm text-center">
                  No demo credits remaining. Sign up for more!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Generated Image Display */}
        {generatedImage && (
          <div id="generated-output" className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-8">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Your {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name} Headshot
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Before */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-4">Before</h3>
                <div className="aspect-square relative rounded-2xl overflow-hidden mb-4 shadow-2xl">
                  <img
                    src={originalImageUrl || ''}
                    alt="Original selfie"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Original image load error:', e);
                    }}
                    onLoad={() => {
                      console.log('Original image loaded successfully');
                    }}
                  />
                </div>
                <p className="text-gray-300 text-sm">Your original selfie</p>
              </div>
              
              {/* After */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-4">After</h3>
                <div className="aspect-square relative rounded-2xl overflow-hidden mb-4 shadow-2xl group">
                  <img
                    src={generatedImage}
                    alt="Generated headshot"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('Generated image loaded successfully');
                    }}
                  />
                  {/* Overlay with expand button */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-200"
                    >
                      <Maximize2 className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name} style
                </p>
              </div>
            </div>
            
            <div className="text-center mt-8 space-y-4">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={credits === 0 || uploading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold px-8 py-4 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-2xl"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Regenerate</span>
                    </>
                  )}
                </button>
                
                <a
                  href={generatedImage}
                  download={`portraitly-${selectedStyle}-headshot.jpg`}
                  className="bg-gradient-to-r from-accent-turquoise to-accent-emerald text-white font-bold px-8 py-4 rounded-xl hover:from-accent-turquoise/90 hover:to-accent-emerald/90 transition-all duration-200 flex items-center space-x-2 shadow-2xl"
                >
                  <Download className="h-5 w-5" />
                  <span>Download</span>
                </a>
              </div>
              
              {credits === 0 && (
                <p className="text-red-400 text-sm">
                  No demo credits remaining. Sign up for more!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Fullscreen Modal */}
        {isFullscreen && generatedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsFullscreen(false)}
            />
            
            {/* Modal Content */}
            <div className="relative z-10 max-w-4xl max-h-[90vh] w-full">
              {/* Close Button */}
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute -top-12 right-0 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-all duration-200 z-20"
              >
                <X className="h-6 w-6" />
              </button>
              
              {/* Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={generatedImage}
                  alt="Generated headshot - Fullscreen"
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
                
                {/* Download Button Overlay */}
                <div className="absolute bottom-4 right-4">
                  <a
                    href={generatedImage}
                    download={`portraitly-${selectedStyle}-headshot.jpg`}
                    className="bg-gradient-to-r from-accent-turquoise to-accent-emerald text-white font-bold px-6 py-3 rounded-xl hover:from-accent-turquoise/90 hover:to-accent-emerald/90 transition-all duration-200 flex items-center space-x-2 shadow-2xl"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Upload Modal */}
        <MobileUploadModal
          isOpen={showMobileUpload}
          onClose={() => setShowMobileUpload(false)}
          sessionId={sessionId}
        />

      </main>
    </div>
  )
}
