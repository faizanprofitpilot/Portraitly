'use client'

import { useState, useEffect } from 'react'
import { Camera, Download, ArrowLeft, Sparkles, Image as ImageIcon, CheckCircle, X, Maximize2, Smartphone, LogOut } from 'lucide-react'
import Link from 'next/link'
import MobileUploadModal from './MobileUploadModal'
import { createClient } from '@/lib/supabase'

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
  const [credits, setCredits] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMobileUpload, setShowMobileUpload] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = createClient()

  // Initialize auth and user data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.error('Auth error:', authError)
          window.location.href = '/'
          return
        }

        setUser(user)

        // Ensure user exists in database
        const ensureResponse = await fetch('/api/ensure-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!ensureResponse.ok) {
          console.error('Failed to ensure user exists')
          window.location.href = '/'
          return
        }

        const ensureData = await ensureResponse.json()
        
        if (ensureData.success) {
          setUserData(ensureData.user)
          setCredits(ensureData.user.credits_remaining)
        } else {
          console.error('User ensure failed:', ensureData.error)
          window.location.href = '/'
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Initialization error:', error)
        window.location.href = '/'
      }
    }

    initializeAuth()
  }, [])

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

    const interval = setInterval(pollForUploads, 1000)
    return () => clearInterval(interval)
  }, [sessionId])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setOriginalImageUrl(URL.createObjectURL(file))
      setGeneratedImage(null) // Clear previous generation
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile || !previewUrl) return

    setUploading(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string
        
        const response = await fetch('/api/generate-headshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            style: selectedStyle,
            isDemo: false
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate headshot')
        }

        const data = await response.json()
        setGeneratedImage(data.image)
        
        // Refresh user data to get updated credits
        const userResponse = await fetch('/api/get-user')
        if (userResponse.ok) {
          const userDataResponse = await userResponse.json()
          if (userDataResponse.success) {
            setUserData(userDataResponse.user)
            setCredits(userDataResponse.user.credits_remaining)
          }
        }

        // Auto-scroll to results
        setTimeout(() => {
          const outputSection = document.getElementById('output-section')
          if (outputSection) {
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 500)
      }
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      console.error('Error generating headshot:', error)
      alert('Failed to generate headshot. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
    } else {
      window.location.href = '/'
    }
  }

  const downloadImage = (imageData: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageData
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openFullscreen = (imageData: string) => {
    setIsFullscreen(true)
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Portraitly - Full Size</title></head>
          <body style="margin:0;padding:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            <img src="${imageData}" style="max-width:100%;max-height:100%;object-fit:contain;" />
          </body>
        </html>
      `)
    }
  }

  // Show loading while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Sign Out Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Portraitly
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            {userData ? `Hi ${userData.email.split('@')[0]}!` : 'Create professional headshots with AI'}
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md">
            <span className="text-sm font-medium text-gray-700">
              {credits} credits remaining
            </span>
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Upload Your Photo
            </h2>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Click to upload a photo
                  </p>
                  <p className="text-sm text-gray-500">
                    JPG, PNG up to 10MB
                  </p>
                </label>
              </div>

              {/* Mobile Upload */}
              <button
                onClick={() => setShowMobileUpload(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Smartphone className="h-5 w-5" />
                Upload from Phone
              </button>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Preview</h3>
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Selected"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                      setOriginalImageUrl(null)
                      setGeneratedImage(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Style Selection */}
        {previewUrl && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Choose Your Style
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedStyle === style.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 mb-2">{style.name}</h3>
                      <p className="text-sm text-gray-600">{style.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        {previewUrl && (
          <div className="max-w-2xl mx-auto mb-8">
            <button
              onClick={handleGenerate}
              disabled={uploading || credits <= 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
            >
              {uploading ? (
                <>
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Professional Headshot
                </>
              )}
            </button>
            {credits <= 0 && (
              <p className="text-center text-red-500 mt-2">
                No credits remaining. Please upgrade your plan.
              </p>
            )}
          </div>
        )}

        {/* Results Section */}
        {generatedImage && (
          <div id="output-section" className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Your Professional Headshot
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Original */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Original</h3>
                  <div className="relative">
                    <img
                      src={originalImageUrl || ''}
                      alt="Original"
                      className="w-full aspect-[4/5] object-cover rounded-xl"
                    />
                    <button
                      onClick={() => originalImageUrl && openFullscreen(originalImageUrl)}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Generated */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">AI Generated</h3>
                  <div className="relative">
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="w-full aspect-[4/5] object-cover rounded-xl"
                    />
                    <button
                      onClick={() => openFullscreen(generatedImage)}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={() => downloadImage(generatedImage, 'portraitly-headshot.png')}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Headshot
                </button>
                <button
                  onClick={() => setGeneratedImage(null)}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Try Different Style
                </button>
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
      </div>
    </div>
  )
}