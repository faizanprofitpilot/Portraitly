'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Camera, Download, LogOut, CreditCard, Image as ImageIcon } from 'lucide-react'
import type { Photo } from '@/lib/database'

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      // Fetch user credits
      const { data: userData } = await supabase
        .from('users')
        .select('credits_remaining')
        .eq('id', user.id)
        .single()

      if (userData) {
        setCredits(userData.credits_remaining)
      }

      // Fetch user photos
      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (photosData) {
        setPhotos(photosData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || credits === 0) return

    setUploading(true)
    try {
      // Upload to Supabase storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `originals/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

      // Call API to generate headshot
      const response = await fetch('/api/generate-headshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: publicUrl,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate headshot')
      }

      const { generatedUrl, photoId } = await response.json()

      // Update photos state
      const newPhoto: Photo = {
        id: photoId,
        user_id: user.id,
        original_url: publicUrl,
        generated_url: generatedUrl,
        created_at: new Date().toISOString()
      }

      setPhotos(prev => [newPhoto, ...prev])
      setCredits(prev => prev - 1)
      setSelectedFile(null)

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (error) {
      console.error('Error uploading:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">Portraitly</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-primary-50 px-4 py-2 rounded-lg">
                <CreditCard className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">
                  {credits} credits remaining
                </span>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Generate Your Professional Headshot
          </h1>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-4">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
              
              {selectedFile ? (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Selected: {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Choose a selfie to upload
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, or JPEG up to 10MB
                  </p>
                </div>
              )}
              
              <div className="flex gap-4 justify-center">
                <label
                  htmlFor="file-upload"
                  className="btn-secondary cursor-pointer"
                >
                  Choose File
                </label>
                
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || credits === 0 || uploading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      <span>Generate Headshot</span>
                    </>
                  )}
                </button>
              </div>
              
              {credits === 0 && (
                <p className="text-red-600 text-sm">
                  No credits remaining. Upgrade coming soon!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Headshots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="aspect-square relative">
                    {photo.generated_url ? (
                      <img
                        src={photo.generated_url}
                        alt="Generated headshot"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Processing...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </span>
                      {photo.generated_url && (
                        <a
                          href={photo.generated_url}
                          download
                          className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                        >
                          <Download className="h-4 w-4" />
                          <span className="text-sm">Download</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {photos.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No headshots yet
            </h3>
            <p className="text-gray-500">
              Upload your first selfie to get started!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
