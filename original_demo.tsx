'use client'

import { useState, useEffect } from 'react'
import { Camera, Upload, Loader2, Download, RotateCcw, Maximize2, Smartphone } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import MobileUploadModal from './MobileUploadModal'

export default function Demo() {
  const { user, credits, refreshCredits } = useAuth()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showMobileUpload, setShowMobileUpload] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

  // Generate session ID on component mount
  useEffect(() => {
    const id = Math.random().toString(36).substring(2, 15)
    setSessionId(id)
  }, [])

  // Poll for mobile uploads
  useEffect(() => {
    if (!sessionId) return

    const pollForUploads = () => {
      const uploads = localStorage.getItem(`mobile-uploads-${sessionId}`)
      if (uploads) {
        try {
          const files = JSON.parse(uploads)
          if (files.length > 0) {
            const latestFile = files[files.length - 1]
            setSelectedImage(latestFile.dataUrl)
            setShowMobileUpload(false)
            // Clear the uploads after using them
            localStorage.removeItem(`mobile-uploads-${sessionId}`)
          }
        } catch (error) {
          console.error('Error parsing mobile uploads:', error)
        }
      }
    }

    const interval = setInterval(pollForUploads, 1000)
    return () => clearInterval(interval)
  }, [sessionId])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (!selectedImage || credits <= 0) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-headshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          isDemo: false
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate headshot')
      }

      const data = await response.json()
      setGeneratedImage(data.image)
      
      // Refresh credits after successful generation
      await refreshCredits()

      // Auto-scroll to results after generation
      setTimeout(() => {
        const outputSection = document.getElementById('output-section')
        if (outputSection) {
          outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 500)
    } catch (error) {
      console.error('Error generating headshot:', error)
      alert('Failed to generate headshot. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setGeneratedImage(null)
    handleGenerate()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Portraitly
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            {user ? `Hi ${user.email?.split('@')[0]}!` : 'Create professional headshots with AI'}
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
                  onChange={handleImageUpload}
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
            {selectedImage && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Preview</h3>
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        {selectedImage && (
          <div className="max-w-2xl mx-auto mb-8">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || credits <= 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
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
                      src={selectedImage}
                      alt="Original"
                      className="w-full aspect-[4/5] object-cover rounded-xl"
                    />
                    <button
                      onClick={() => selectedImage && openFullscreen(selectedImage)}
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
                      onClick={() => generatedImage && openFullscreen(generatedImage)}
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
                  onClick={handleRegenerate}
                  disabled={isGenerating || credits <= 0}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Regenerate
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