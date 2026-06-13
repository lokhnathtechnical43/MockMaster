'use client'

import { useState, useEffect } from 'react'
import { auth, isFirebaseReady } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  User
} from 'firebase/auth'
import { ensureUserDocument } from '@/lib/firestore-service'

interface AuthState {
  user: User | null
  loading: boolean
}

const GUEST_USER_KEY = 'examprep_guest_user'

export function useFirebaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, loading: true })
  const [error, setError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [verifySent, setVerifySent] = useState(false)
  const [isLocalGuest, setIsLocalGuest] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('')

  useEffect(() => {
    // Check for local guest user first
    try {
      const localGuest = localStorage.getItem(GUEST_USER_KEY)
      if (localGuest) {
        setIsLocalGuest(true)
        setAuthState({ user: null, loading: false })
        return
      }
    } catch (e) {
      console.warn('[Auth] localStorage not available')
    }

    // Only listen to Firebase auth if Firebase is configured
    if (!auth || !isFirebaseReady()) {
      setAuthState({ user: null, loading: false })
      return
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setAuthState({ user, loading: false })
        // Ensure Firestore user document exists when user signs in
        if (user && user.emailVerified) {
          ensureUserDocument({
            uid: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
          }).catch(err => console.warn('[Auth] ensureUserDocument failed:', err))
        }
      })
      return () => unsubscribe()
    } catch (error) {
      console.error('[Auth] onAuthStateChanged failed:', error)
      setAuthState({ user: null, loading: false })
    }
  }, [])

  // Login with Email + Password
  const loginWithEmail = async (email: string, password: string) => {
    if (!auth || !isFirebaseReady()) {
      setError('Firebase is not configured. Please use Guest mode instead.')
      return
    }
    setError('')
    setLoginLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      // Check if email is verified
      if (credential.user && !credential.user.emailVerified) {
        setPendingVerifyEmail(email)
        setNeedsVerification(true)
        // Sign out the unverified user
        await firebaseSignOut(auth)
        setLoginLoading(false)
        return
      }
      // Ensure Firestore user document exists
      if (credential.user) {
        await ensureUserDocument({
          uid: credential.user.uid,
          name: credential.user.displayName || 'User',
          email: credential.user.email || '',
          photoURL: credential.user.photoURL || undefined,
        })
      }
      // Clear local guest if email login succeeds
      localStorage.removeItem(GUEST_USER_KEY)
      setIsLocalGuest(false)
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.')
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Contact support.')
      } else {
        setError('Login failed. Please try again.')
      }
    }
    setLoginLoading(false)
  }

  // Sign Up with Email + Password + Name
  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (!auth || !isFirebaseReady()) {
      setError('Firebase is not configured. Please use Guest mode instead.')
      return
    }
    setError('')
    setSignupLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      // Set display name
      if (credential.user) {
        await updateProfile(credential.user, { displayName: name })
        // Create Firestore user document immediately
        await ensureUserDocument({
          uid: credential.user.uid,
          name: name,
          email: email,
          photoURL: credential.user.photoURL || undefined,
        })
        // Send email verification
        try {
          await firebaseSendEmailVerification(credential.user, {
            url: window.location.origin,
            handleCodeInApp: false,
          })
          setVerifySent(true)
        } catch (verifyErr) {
          console.warn('Email verification send failed:', verifyErr)
        }
      }
      // Clear local guest if signup succeeds
      localStorage.removeItem(GUEST_USER_KEY)
      setIsLocalGuest(false)
    } catch (err: any) {
      console.error('Signup error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.')
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email login not available yet. Please use Guest mode.')
      } else {
        setError('Sign up failed. Please try again.')
      }
    }
    setSignupLoading(false)
  }

  // Send Password Reset Email
  const sendPasswordReset = async (email: string) => {
    if (!auth || !isFirebaseReady()) {
      setError('Firebase is not configured. Please use Guest mode instead.')
      return
    }
    setError('')
    setResetLoading(true)
    setResetSent(false)
    try {
      await firebaseSendPasswordResetEmail(auth, email, {
        url: window.location.origin,
        handleCodeInApp: false,
      })
      setResetSent(true)
    } catch (err: any) {
      console.error('Password reset error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.')
      } else {
        setError('Failed to send reset email. Please try again.')
      }
    }
    setResetLoading(false)
  }

  // Resend Email Verification (only works if user is currently signed in)
  const resendVerification = async () => {
    if (!auth || !isFirebaseReady()) return
    if (!authState.user) {
      setError('Please login with your credentials to resend verification email.')
      return
    }
    setError('')
    setVerifyLoading(true)
    try {
      await firebaseSendEmailVerification(authState.user, {
        url: window.location.origin,
        handleCodeInApp: false,
      })
      setVerifySent(true)
    } catch (err: any) {
      console.error('Resend verification error:', err)
      if (err.code === 'auth/too-many-requests') {
        setError('Too many verification emails sent. Please wait a few minutes and try again.')
      } else {
        setError('Failed to send verification email. Please try again.')
      }
    }
    setVerifyLoading(false)
  }

  // Resend verification by signing in with credentials
  const resendVerificationWithCredentials = async (email: string, password: string) => {
    if (!auth || !isFirebaseReady()) return
    setError('')
    setVerifyLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      if (credential.user) {
        await firebaseSendEmailVerification(credential.user, {
          url: window.location.origin,
          handleCodeInApp: false,
        })
        // Sign out after sending verification
        await firebaseSignOut(auth)
        setVerifySent(true)
      }
    } catch (err: any) {
      console.error('Resend verification with credentials error:', err)
      if (err.code === 'auth/too-many-requests') {
        setError('Too many verification emails sent. Please wait a few minutes and try again.')
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.')
      } else {
        setError('Failed to send verification email. Please try again.')
      }
    }
    setVerifyLoading(false)
  }

  const loginAsGuest = async () => {
    setError('')
    setGuestLoading(true)
    try {
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
      localStorage.removeItem(GUEST_USER_KEY)
      setIsLocalGuest(false)
      if (authState.user && auth) {
        await firebaseSignOut(auth)
      }
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // User is logged in if either Firebase user exists OR local guest
  const isLoggedIn = !!authState.user || isLocalGuest
  const isGuest = isLocalGuest || (authState.user?.isAnonymous ?? false)

  // Check if email login is available (Firebase must be configured)
  const isEmailLoginAvailable = isFirebaseReady()

  // Get display name/email
  const getUserDisplay = () => {
    if (authState.user?.displayName) return authState.user.displayName
    if (authState.user?.email) return authState.user.email
    if (isLocalGuest) return 'Guest User'
    return null
  }

  // Get user email
  const getUserEmail = () => {
    if (authState.user?.email) return authState.user.email
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
    error,
    loginLoading,
    signupLoading,
    guestLoading,
    resetLoading,
    verifyLoading,
    resetSent,
    verifySent,
    isLoggedIn,
    isGuest,
    isEmailLoginAvailable,
    needsVerification,
    pendingVerifyEmail,
    getUserDisplay,
    getUserEmail,
    getUserId,
    loginWithEmail,
    signUpWithEmail,
    loginAsGuest,
    sendPasswordReset,
    resendVerification,
    resendVerificationWithCredentials,
    setNeedsVerification,
    setPendingVerifyEmail,
    setError,
    setResetSent,
    setVerifySent,
    logout,
  }
}
