import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

/**
 * Upload an image file to Firebase Storage and return the download URL.
 * Falls back to base64 data URL if Firebase Storage is not available.
 */
export async function uploadImage(
  file: File,
  folder: string = 'general'
): Promise<string> {
  // Validate file
  if (!file) throw new Error('No file provided')
  if (!file.type.startsWith('image/')) throw new Error('File must be an image')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be less than 5MB')

  // If Firebase Storage is available, upload there
  if (storage) {
    try {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const path = `${folder}/${timestamp}_${safeName}`
      const storageRef = ref(storage, path)

      // Upload with metadata
      const metadata = { contentType: file.type }
      await uploadBytes(storageRef, file, metadata)

      // Get download URL
      const url = await getDownloadURL(storageRef)
      return url
    } catch (error) {
      console.warn('[ImageUpload] Firebase Storage upload failed, falling back to base64:', error)
    }
  }

  // Fallback: convert to base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert image to base64'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Delete an image from Firebase Storage by URL.
 * Only works with Firebase Storage URLs; silently skips data URLs.
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !storage) return

  // Skip base64 data URLs (nothing to delete)
  if (imageUrl.startsWith('data:')) return

  try {
    // Extract storage path from URL
    const url = new URL(imageUrl)
    const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/)
    if (pathMatch && pathMatch[1]) {
      const filePath = decodeURIComponent(pathMatch[1])
      const storageRef = ref(storage, filePath)
      await deleteObject(storageRef)
    }
  } catch (error) {
    console.warn('[ImageUpload] Failed to delete image from storage:', error)
  }
}

/**
 * Compress an image file before upload.
 * Returns a compressed File object.
 */
export function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file) // fallback to original
    reader.readAsDataURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // Scale down if wider than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => resolve(file)
  })
}
