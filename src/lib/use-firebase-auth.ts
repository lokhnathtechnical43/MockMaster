'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
}

export function useFirebaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, loading: true })
  const [otpSent, setOtpSent] = useState(false)
  const [verificationId, setVerificationId] = useState<string>('')
  const [error, setError] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({ user, loading: false })
    })
    return () => unsubscribe()
  }, [])

  const setupRecaptcha = () => {
    if (typeof window === 'undefined') return null
    // Check if recaptcha already exists
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier
    }
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => { /* reCAPTCHA solved */ }
      })
      ;(window as any).recaptchaVerifier = recaptchaVerifier
      return recaptchaVerifier
    } catch (e) {
      console.error('Recaptcha setup error:', e)
      return null
    }
  }

  const sendOtp = async (phoneNumber: string) => {
    setError('')
    setSendingOtp(true)
    try {
      // Format phone number with +91 for India
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
      
      const recaptchaVerifier = setupRecaptcha()
      if (!recaptchaVerifier) {
        setError('Failed to setup verification. Please refresh the page.')
        setSendingOtp(false)
        return
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)
      setVerificationId(confirmationResult.verificationId)
      ;(window as any).confirmationResult = confirmationResult
      setOtpSent(true)
    } catch (err: any) {
      console.error('Send OTP error:', err)
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please enter a valid 10-digit number.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else if (err.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later.')
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Phone login not available yet. Please use Guest mode instead.')
      } else {
        setError('Failed to send OTP. Please try again or use Guest mode.')
      }
    }
    setSendingOtp(false)
  }

  const verifyOtp = async (otp: string) => {
    setError('')
    setVerifyingOtp(true)
    try {
      const confirmationResult = (window as any).confirmationResult
      if (!confirmationResult) {
        setError('Session expired. Please request OTP again.')
        setVerifyingOtp(false)
        return
      }
      await confirmationResult.confirm(otp)
      setOtpSent(false)
    } catch (err: any) {
      console.error('Verify OTP error:', err)
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.')
      } else if (err.code === 'auth/code-expired') {
        setError('OTP expired. Please request a new one.')
      } else {
        setError('Verification failed. Please try again.')
      }
    }
    setVerifyingOtp(false)
  }

  const loginAsGuest = async () => {
    setError('')
    setGuestLoading(true)
    try {
      await signInAnonymously(auth)
    } catch (err: any) {
      console.error('Guest login error:', err)
      if (err.code === 'auth/operation-not-allowed') {
        setError('Guest login is not enabled. Please enable Anonymous Auth in Firebase Console.')
      } else {
        setError('Failed to login as guest. Please try again.')
      }
    }
    setGuestLoading(false)
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const resetOtp = () => {
    setOtpSent(false)
    setVerificationId('')
    setError('')
    // Reset recaptcha
    if ((window as any).recaptchaVerifier) {
      ;(window as any).recaptchaVerifier = null
    }
  }

  // Check if user is a guest (anonymous)
  const isGuest = authState.user?.isAnonymous ?? false

  return {
    user: authState.user,
    loading: authState.loading,
    otpSent,
    error,
    sendingOtp,
    verifyingOtp,
    guestLoading,
    isGuest,
    sendOtp,
    verifyOtp,
    loginAsGuest,
    logout,
    resetOtp
  }
}
