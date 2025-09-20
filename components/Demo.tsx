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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null) // Keep for backward compatibility
  const [selectedStyle, setSelectedStyle] = useState('professional')
  const [genderPreference, setGenderPreference] = useState<'male' | 'female' | 'auto' | 'neutral'>('auto')
  const [uploading, setUploading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [credits, setCredits] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMobileUpload, setShowMobileUpload] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  const supabase = createClient()

  // Generate session ID on component mount
  useEffect(() => {
    const newSessionId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
  }, [])

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('🔍 Demo: Fetching user data from /api/user...')
        const response = await fetch('/api/user')
        console.log('📊 Demo: API response status:', response.status)
        const data = await response.json()
        console.log('📊 Demo: API response data:', data)
        
        if (data.success && data.user) {
          console.log('✅ Demo: User data fetched successfully:', data.user.email)
          setUserData(data.user)
          setCredits(data.user.credits)
        } else {
          console.error('❌ Demo: Failed to fetch user data:', data.error)
          console.log('🔄 Demo: Redirecting to landing page due to user data failure')
          window.location.href = '/'
        }
      } catch (error) {
        console.error('❌ Demo: Error fetching user data:', error)
        console.log('🔄 Demo: Redirecting to landing page due to fetch error')
        window.location.href = '/'
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Poll for mobile uploads only when mobile upload modal is open
  useEffect(() => {
    if (!sessionId || !showMobileUpload) return

    const pollForUploads = async () => {
      try {
        console.log('📱 Polling server for mobile uploads, session:', sessionId)
        
        const response = await fetch(`/api/mobile-uploads?sessionId=${sessionId}`)
        const data = await response.json()
        
        console.log('📱 Server response:', data)
        
        if (data.uploads && data.uploads.length > 0) {
          // Process the first uploaded file
          const uploadedFile = data.uploads[0]
          const imageUrl = `/uploads/${uploadedFile.filename}`
          
          console.log('📸 Processing mobile upload:', uploadedFile, 'URL:', imageUrl)
          
          // Create a File object from the uploaded image
          fetch(imageUrl)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
              }
              return response.blob()
            })
            .then(blob => {
              const file = new File([blob], uploadedFile.originalName, { type: 'image/jpeg' })
              console.log('✅ Mobile upload processed successfully:', file.name)
              setSelectedFile(file)
              setPreviewUrl(imageUrl)
              setOriginalImageUrl(imageUrl)
              setShowMobileUpload(false) // Close mobile upload modal
            })
            .catch(error => {
              console.error('❌ Error loading mobile upload:', error)
            })
        }
      } catch (error) {
        console.error('❌ Error polling server for uploads:', error)
      }
    }

    const interval = setInterval(pollForUploads, 2000)
    return () => clearInterval(interval)
  }, [sessionId, showMobileUpload])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(files)
      setSelectedFile(files[0]) // Keep first file for backward compatibility
      // Create preview URL for the first uploaded image
      const url = URL.createObjectURL(files[0])
      setPreviewUrl(url)
      setOriginalImageUrl(url) // Store original image URL separately
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      setSelectedFiles(files)
      setSelectedFile(files[0]) // Keep first file for backward compatibility
      // Create preview URL for the first uploaded image
      const url = URL.createObjectURL(files[0])
      setPreviewUrl(url)
      setOriginalImageUrl(url) // Store original image URL separately
    }
  }

  const handleGenerate = async () => {
    if (selectedFiles.length === 0 || credits < selectedFiles.length) return

    setUploading(true)
    try {
      const generatedUrls: string[] = []
      let finalCredits = credits

      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        console.log(`Processing image ${i + 1}/${selectedFiles.length}:`, file.name)
        
        // Convert file to base64 for API
        const base64 = await fileToBase64(file)
        
        // Call clean generate API
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64,
            style: selectedStyle,
            genderPreference: genderPreference
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          if (response.status === 402 && errorData.requiresUpgrade) {
            alert('You need more credits to generate images. Please upgrade your plan.')
            break
          } else {
            alert(`Error processing ${file.name}: ${errorData.error || 'Failed to generate image'}`)
            continue
          }
        }

        const result = await response.json()

        if (result.url) {
          generatedUrls.push(result.url)
          finalCredits = result.creditsRemaining
        }
      }

      if (generatedUrls.length > 0) {
        if (generatedUrls.length === 1) {
          setGeneratedImage(generatedUrls[0])
        } else {
          setGeneratedImages(generatedUrls)
        }
        setCredits(finalCredits)
        setSelectedFiles([])
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
      }
    } catch (error) {
      console.error('❌ Error generating with Gemini:', error)
      alert('Failed to generate headshot with AI. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      window.location.href = '/'
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-magical-dark via-magical-deep to-magical-teal flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your demo...</p>
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
            {userData && (
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-white">
                  {userData.email}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                {credits} credits remaining
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-500/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30 flex items-center space-x-2"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Demo Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-accent-turquoise to-accent-emerald bg-clip-text text-transparent">
              Portraitly
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Upload a selfie and transform it into a professional headshot with AI magic!
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                isDragOver 
                  ? 'border-accent-turquoise bg-accent-turquoise/10 scale-105' 
                  : 'border-white/30 hover:border-white/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="space-y-6">
                {selectedFiles.length > 0 ? (
                  <div className="space-y-4">
                    {selectedFiles.length === 1 ? (
                      <div className="aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden shadow-2xl">
                        <img
                          src={previewUrl || ''}
                          alt="Uploaded selfie"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                        {selectedFiles.slice(0, 4).map((file, index) => {
                          const url = index === 0 ? (previewUrl || '') : URL.createObjectURL(file)
                          return (
                            <div key={index} className="aspect-square rounded-xl overflow-hidden shadow-lg">
                              <img
                                src={url}
                                alt={`Uploaded image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )
                        })}
                        {selectedFiles.length > 4 && (
                          <div className="aspect-square rounded-xl bg-white/10 flex items-center justify-center">
                            <span className="text-white font-semibold">+{selectedFiles.length - 4} more</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-lg font-medium text-white mb-1">
                        {selectedFiles.length === 1 
                          ? selectedFiles[0]?.name 
                          : `${selectedFiles.length} images selected`
                        }
                      </p>
                      <p className="text-sm text-gray-300">
                        {selectedFiles.length === 1 
                          ? `${((selectedFiles[0]?.size || 0) / 1024 / 1024).toFixed(2)} MB`
                          : `${selectedFiles.reduce((total, file) => total + file.size, 0) / 1024 / 1024} MB total`
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="h-16 w-16 text-white/60 mx-auto mb-4" />
                    <p className="text-xl font-medium text-white mb-2">
                      Choose images to upload
                    </p>
                    <p className="text-sm text-gray-300">
                      Drag & drop images here or click to select multiple files
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, or JPEG up to 10MB each
                    </p>
                  </div>
                )}
                
                <div className="flex gap-4 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="bg-white/20 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-200 cursor-pointer border border-white/20"
                  >
                    {selectedFiles.length > 0 ? 'Change Photos' : 'Choose Files'}
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

              {/* Gender Preference Toggle */}
              <div className="mt-6">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Attire Preference
                  </h3>
                  <p className="text-sm text-gray-300">
                    Choose the style of professional attire that works best for you
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'auto', name: 'Auto', description: 'Let AI decide based on image' },
                    { id: 'neutral', name: 'Neutral', description: 'Gender-neutral professional attire' },
                    { id: 'male', name: 'Masculine', description: 'Suits, ties, masculine styles' },
                    { id: 'female', name: 'Feminine', description: 'Blouses, dresses, feminine styles' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setGenderPreference(option.id as 'male' | 'female' | 'auto' | 'neutral')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 text-center backdrop-blur-sm ${
                        genderPreference === option.id
                          ? 'border-accent-turquoise bg-accent-turquoise/20 shadow-lg'
                          : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="font-semibold text-white mb-1">{option.name}</div>
                      <div className="text-xs text-gray-300">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={selectedFiles.length === 0 || credits < selectedFiles.length || uploading}
                className="w-full bg-gradient-to-r from-accent-turquoise to-accent-emerald text-white font-bold px-8 py-4 rounded-xl hover:from-accent-turquoise/90 hover:to-accent-emerald/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-2xl"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating {selectedFiles.length > 1 ? `${selectedFiles.length} ` : ''}{STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name} Headshot{selectedFiles.length > 1 ? 's' : ''}...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    <span>Generate {selectedFiles.length > 1 ? `${selectedFiles.length} ` : ''}{STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name} Headshot{selectedFiles.length > 1 ? 's' : ''}</span>
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

        {/* Multiple Generated Images Display */}
        {generatedImages.length > 0 && (
          <div id="generated-output" className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-8">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Your {generatedImages.length} {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name} Headshots
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {generatedImages.map((imageUrl, index) => (
                <div key={index} className="text-center">
                  <div className="aspect-square relative rounded-2xl overflow-hidden mb-4 shadow-2xl group">
                    <img
                      src={imageUrl}
                      alt={`Generated headshot ${index + 1}`}
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
                        onClick={() => {
                          setGeneratedImage(imageUrl)
                          setIsFullscreen(true)
                        }}
                        className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-200"
                      >
                        <Maximize2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name} style #{index + 1}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8 space-y-4">
              <div className="flex gap-4 justify-center flex-wrap">
                {generatedImages.map((imageUrl, index) => (
                  <a
                    key={index}
                    href={imageUrl}
                    download={`portraitly-${selectedStyle}-headshot-${index + 1}.jpg`}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download #{index + 1}</span>
                  </a>
                ))}
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