'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Check, X, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function MobileUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const session = searchParams.get('session');
    if (session) {
      setSessionId(session);
    }
  }, [searchParams]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') && 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    );
    
    if (imageFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...imageFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0 || !sessionId) return;

    setUploading(true);
    
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sessionId', sessionId);

        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/mobile-upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('📱 Mobile upload successful:', result);
          setUploadedFiles(prev => [...prev, result.filename]);
          
          // Success - file is now available at /uploads/{filename}
          alert(`✅ File uploaded successfully!\nYour photo is now available on the desktop.`);
        } else {
          const errorData = await response.json();
          console.error('📱 Upload failed:', response.status, errorData);
        }
      }
      
      // Clear selected files after successful upload
      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <button
            onClick={goBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="flex-1 text-center font-semibold text-gray-900">
            Portraitly Upload
          </h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Instructions */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-emerald rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Upload Your Selfie
          </h2>
          <p className="text-gray-600">
            Take a selfie or select photos from your gallery to create professional headshots
          </p>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-4 px-6 bg-gradient-to-r from-primary-500 to-accent-emerald text-white rounded-xl font-medium hover:from-primary-600 hover:to-accent-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
              <Camera className="h-5 w-5" />
              <span>{uploading ? 'Uploading...' : 'Select or Take Photo'}</span>
            </div>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Selected Photos</h3>
            <div className="space-y-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={uploadFiles}
              disabled={uploading}
              className="w-full mt-4 py-3 px-6 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="h-4 w-4" />
                <span>{uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Photo${selectedFiles.length > 1 ? 's' : ''}`}</span>
              </div>
            </button>
          </div>
        )}

        {/* Upload Success */}
        {uploadedFiles.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Upload Complete!</h3>
            </div>
            <p className="text-green-700 text-sm">
              {uploadedFiles.length} photo{uploadedFiles.length > 1 ? 's' : ''} uploaded successfully. 
              They should now appear in your desktop interface.
            </p>
          </div>
        )}

        {/* Session Info */}
        {sessionId && (
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Session: <span className="font-mono">{sessionId.slice(-8)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
