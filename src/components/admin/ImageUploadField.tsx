'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { uploadImage, compressImage } from '@/lib/image-upload'

interface ImageUploadFieldProps {
  imageUrl: string
  onImageUrlChange: (url: string) => void
  folder?: string
  label?: string
  previewHeight?: string
}

/**
 * Reusable image upload field for admin panel.
 * Supports file upload (with compression) and direct URL paste.
 */
export default function ImageUploadField({
  imageUrl,
  onImageUrlChange,
  folder = 'general',
  label = 'Image (Optional)',
  previewHeight = 'h-24',
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const url = await uploadImage(compressed, folder)
      onImageUrlChange(url)
    } catch (error) {
      console.error('Image upload failed:', error)
      alert('Image upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <div className="space-y-2">
        {/* Preview */}
        {imageUrl ? (
          <div className="relative group">
            <img
              src={imageUrl}
              alt="Preview"
              className={`w-full ${previewHeight} object-cover rounded-xl border border-gray-200`}
            />
            <button
              onClick={() => onImageUrlChange('')}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-orange-500 hover:border-orange-300 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImagePlus className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
            e.target.value = ''
          }}
        />
        {/* URL input as alternative */}
        <input
          type="url"
          value={imageUrl.startsWith('data:') ? '' : imageUrl}
          onChange={e => onImageUrlChange(e.target.value)}
          placeholder="Or paste image URL..."
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>
    </div>
  )
}
