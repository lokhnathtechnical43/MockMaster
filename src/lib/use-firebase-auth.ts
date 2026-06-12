'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
}

const GUEST_USER_KEY = 'examprep_guest_user'

export function useFirebaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, loading: true })
  const [otpSent, setOtpSent] = useState(false)
  const [verificationId, setVerificationId] = useState<string>('')
  const [error, setError] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const [isLocalGuest, setIsLocalGuest] = useState(false)

  useEffect(() => {
    // Check for local guest user first
    const localGuest = localStorage.getItem(GUEST_USER_KEY)
    if (localGuest) {
      setIsLocalGuest(true)
      setAuthState({ user: null, loading: false })
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({ user, loading: false })
    })
    return () => unsubscribe()
  }, [])

  const setupRecaptcha = () => {
    if (typeof window === 'undefined') return null
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
      } else if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        setError('Phone login not available yet. Please use Guest mode instead.')
      } else {
        setError('Failed to send OTP. Please try Guest mode instead.')
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
      // Clear local guest if phone login succeeds
      localStorage.removeItem(GUEST_USER_KEY)
      setIsLocalGuest(false)
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
      // Create a local guest user (no Firebase needed)
      const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
      const guestData = {
        id: guestId,
        name: 'Guest User',
        createdAt: new Date().toISOString()
      }
      localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestData))
      setIsLocalGuest(true)
      setAuthState({ user: null, loading: false })
    } catch (err: any) {
      console.error('Guest login error:', err)
      setError('Failed to login as guest. Please try again.')
    }
    setGuestLoading(false)
  }

  const logout = async () => {
    try {
      // Clear local guest
      localStorage.removeItem(GUEST_USER_KEY)
      setIsLocalGuest(false)
      // Also sign out from Firebase if logged in
      if (authState.user) {
        await firebaseSignOut(auth)
      }
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const resetOtp = () => {
    setOtpSent(false)
    setVerificationId('')
    setError('')
    if ((window as any).recaptchaVerifier) {
      ;(window as any).recaptchaVerifier = null
    }
  }

  // User is logged in if either Firebase user exists OR local guest
  const isLoggedIn = !!authState.user || isLocalGuest
  const isGuest = isLocalGuest || (authState.user?.isAnonymous ?? false)

  // Get display name/phone
  const getUserDisplay = () => {
    if (authState.user?.phoneNumber) return authState.user.phoneNumber
    if (isLocalGuest) return 'Guest User'
    return null
  }

  // Get user ID for results
  const getUserId = () => {
    if (authState.user) return authState.user.uid
    if (isLocalGuest) {
      const localGuest = localStorage.getItem(GUEST_USER_KEY)
      if (localGuest) {
        const data = JSON.parse(localGuest)
        return data.id
      }
    }
    return null
  }

  return {
    user: authState.user,
    loading: authState.loading,
    otpSent,
    error,
    sendingOtp,
    verifyingOtp,
    guestLoading,
    isLoggedIn,
    isGuest,
    getUserDisplay,
    getUserId,
    sendOtp,
    verifyOtp,
    loginAsGuest,
    logout,
    resetOtp
  }
}
