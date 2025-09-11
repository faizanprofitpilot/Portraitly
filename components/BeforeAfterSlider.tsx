'use client'

import { useState } from 'react'
import { Camera, Sparkles } from 'lucide-react'

interface BeforeAfterSliderProps {
  beforeImage?: string
  afterImage?: string
}

export default function BeforeAfterSlider({ beforeImage, afterImage }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Slider Container */}
      <div 
        className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-premium cursor-ew-resize"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setSliderPosition(50)}
      >
        {/* Before Image */}
        <div className="absolute inset-0">
          {beforeImage ? (
            <img
              src={beforeImage}
              alt="Before"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Upload your selfie</p>
              </div>
            </div>
          )}
        </div>

        {/* After Image */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          {afterImage ? (
            <img
              src={afterImage}
              alt="After"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-600 to-accent-emerald flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="h-16 w-16 text-white mx-auto mb-4" />
                <p className="text-white text-lg">AI-generated headshot</p>
              </div>
            </div>
          )}
        </div>

        {/* Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-600 rounded-full" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
          After
        </div>
      </div>

      {/* Instructions */}
      <p className="text-center text-gray-300 mt-4 text-sm">
        Drag to compare before and after
      </p>
    </div>
  )
}
