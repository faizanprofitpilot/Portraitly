'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface MobileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export default function MobileUploadModal({ isOpen, onClose, sessionId }: MobileUploadModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      generateQRCode();
    }
  }, [isOpen, sessionId]);

  const generateQRCode = async () => {
    try {
      const baseUrl = window.location.origin;
      const mobileUploadUrl = `${baseUrl}/mobile-upload?session=${sessionId}`;
      const qrDataUrl = await QRCode.toDataURL(mobileUploadUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyLink = async () => {
    try {
      const baseUrl = window.location.origin;
      const mobileUploadUrl = `${baseUrl}/mobile-upload?session=${sessionId}`;
      await navigator.clipboard.writeText(mobileUploadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-emerald rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload from Mobile</h2>
          <p className="text-gray-600">
            Scan the QR code with your phone to upload selfies directly
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          {qrCodeUrl ? (
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <img src={qrCodeUrl} alt="Mobile Upload QR Code" className="w-48 h-48" />
            </div>
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-gray-400">Generating QR code...</div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">How to use:</h3>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Open your phone's camera app</li>
            <li>2. Point it at the QR code above</li>
            <li>3. Tap the notification to open the upload page</li>
            <li>4. Select or take a selfie photo</li>
            <li>5. Your photo will appear here automatically!</li>
          </ol>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy Link Instead</span>
            </>
          )}
        </button>

        {/* Status */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Upload session: <span className="font-mono text-xs">{sessionId.slice(-8)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
