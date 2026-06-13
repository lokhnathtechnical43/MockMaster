'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Mail, Shield, ArrowLeft, Loader2, User, Lock, UserPlus,
  Eye, EyeOff, KeyRound, CheckCircle2, Sparkles, X,
  ChevronRight, Send, RefreshCw
} from 'lucide-react'

interface LoginModalProps {
  error: string
  loginLoading: boolean
  signupLoading: boolean
  guestLoading: boolean
  resetLoading: boolean
  resetSent: boolean
  verifySent: boolean
  onLogin: (email: string, password: string) => void
  onSignUp: (email: string, password: string, name: string) => void
  onGuestLogin: () => void
  onPasswordReset: (email: string) => void
  onClearError: () => void
  onClearResetSent: () => void
  onClearVerifySent: () => void
  onClose: () => void
}

export default function LoginModal({
  error,
  loginLoading,
  signupLoading,
  guestLoading,
  resetLoading,
  resetSent,
  verifySent,
  onLogin,
  onSignUp,
  onGuestLogin,
  onPasswordReset,
  onClearError,
  onClearResetSent,
  onClearVerifySent,
  onClose
}: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'verify'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = () => {
    if (email && password) {
      onLogin(email, password)
    }
  }

  const handleSignUp = () => {
    if (email && password && name) {
      onSignUp(email, password, name)
    }
  }

  const handleForgotPassword = () => {
    if (email) {
      onPasswordReset(email)
    }
  }

  const switchMode = (newMode: 'login' | 'signup' | 'forgot' | 'verify') => {
    onClearError()
    onClearResetSent()
    setMode(newMode)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center" style={{ touchAction: 'manipulation' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header Gradient */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 pt-6 pb-8 relative overflow-hidden">
          {/* Decorative blurs */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-orange-500/15 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />

          {/* Close button */}
          <div className="flex items-center justify-between mb-5 relative z-10">
            {mode !== 'login' ? (
              <button
                onClick={() => switchMode('login')}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-white/80" />
              </button>
            ) : (
              <div className="w-9" />
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>

          {/* Logo & Title */}
          <div className="text-center relative z-10">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 via-rose-500 to-pink-500 flex items-center justify-center shadow-xl shadow-orange-500/30 ring-2 ring-white/20">
                <img src="/logo.png" alt="M" className="w-12 h-12 rounded-xl" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-900 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h2 className="text-white font-extrabold text-xl tracking-tight">
              {mode === 'login' && 'Welcome Back!'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'verify' && 'Verify Email'}
            </h2>
            <p className="text-white/50 text-sm mt-1 font-medium">
              {mode === 'login' && 'Login to access your MockMaster account'}
              {mode === 'signup' && 'Sign up for a free MockMaster account'}
              {mode === 'forgot' && 'We\'ll send you a password reset link'}
              {mode === 'verify' && 'Check your email for verification link'}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 pt-6 pb-8 -mt-3 relative z-20 bg-white rounded-t-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <X className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-red-600 text-xs font-semibold">{error}</span>
            </div>
          )}

          {/* Verify Sent Success */}
          {mode === 'signup' && verifySent && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-emerald-700 text-sm font-bold">Verification Email Sent!</span>
              </div>
              <p className="text-emerald-600 text-xs leading-relaxed">
                We&apos;ve sent a verification email to <strong>{email}</strong>. Please check your inbox and verify your email to login.
              </p>
            </div>
          )}

          {/* Reset Sent Success */}
          {mode === 'forgot' && resetSent && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-emerald-700 text-sm font-bold">Reset Email Sent!</span>
              </div>
              <p className="text-emerald-600 text-xs leading-relaxed">
                Password reset link sent to <strong>{email}</strong>. Check your inbox and follow the instructions.
              </p>
            </div>
          )}

          {/* ====== LOGIN FORM ====== */}
          {mode === 'login' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); onClearError() }}
                    className="pl-10 h-12 rounded-xl border-2 border-gray-100 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 text-sm font-medium"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); onClearError() }}
                    className="pl-10 pr-10 h-12 rounded-xl border-2 border-gray-100 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 text-sm font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <button
                  onClick={() => switchMode('forgot')}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 ml-auto"
                >
                  <KeyRound className="w-3 h-3" /> Forgot Password?
                </button>
              </div>

              <Button
                onClick={handleLogin}
                disabled={!email || !password || loginLoading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:via-rose-600 hover:to-pink-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/25 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loginLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" /> Login</>
                )}
              </Button>

              {/* Secure badge */}
              <div className="flex items-center gap-2 text-[10px] text-gray-400 justify-center font-medium">
                <Shield className="w-3 h-3" />
                <span>Your data is encrypted & secure</span>
              </div>

              {/* Switch to Signup */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-orange-600 font-bold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>

              {/* Divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400 font-medium">OR</span>
                </div>
              </div>

              {/* Skip & Continue as Guest */}
              <button
                onClick={onGuestLogin}
                disabled={guestLoading}
                className="w-full h-12 rounded-2xl border-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {guestLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Entering...</>
                ) : (
                  <><User className="w-4 h-4" /> Skip & Continue as Guest <ChevronRight className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Guest mode: Take tests & see results instantly.<br/>
                Email login: Save progress & access from any device.
              </p>
            </div>
          )}

          {/* ====== SIGNUP FORM ====== */}
          {mode === 'signup' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); onClearError() }}
                    className="pl-10 h-12 rounded-xl border-2 border-gray-100 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-medium"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); onClearError() }}
                    className="pl-10 h-12 rounded-xl border-2 border-gray-100 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-medium"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min 6 chars)"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); onClearError() }}
                    className="pl-10 pr-10 h-12 rounded-xl border-2 border-gray-100 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleSignUp}
                disabled={!email || !password || !name || signupLoading}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {signupLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Sign Up</>
                )}
              </Button>

              {/* Email verification note */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <Send className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-blue-600 text-[11px] leading-relaxed font-medium">
                  After signup, we&apos;ll send a verification email with our logo. Please verify your email to login.
                </p>
              </div>

              {/* Switch to Login */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="text-orange-600 font-bold hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>

              {/* Divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400 font-medium">OR</span>
                </div>
              </div>

              {/* Skip & Continue as Guest */}
              <button
                onClick={onGuestLogin}
                disabled={guestLoading}
                className="w-full h-12 rounded-2xl border-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {guestLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Entering...</>
                ) : (
                  <><User className="w-4 h-4" /> Skip & Continue as Guest <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}

          {/* ====== FORGOT PASSWORD FORM ====== */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {/* Illustration */}
              <div className="text-center mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-8 h-8 text-sky-500" />
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); onClearError(); onClearResetSent() }}
                  className="pl-10 h-12 rounded-xl border-2 border-gray-100 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 text-sm font-medium"
                  onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                />
              </div>

              <Button
                onClick={handleForgotPassword}
                disabled={!email || resetLoading}
                className="w-full h-12 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 hover:from-sky-600 hover:via-blue-600 hover:to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-sky-500/25 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {resetLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Send Reset Link</>
                )}
              </Button>

              {resetSent && (
                <button
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="w-full flex items-center justify-center gap-1.5 text-sky-600 text-xs font-bold hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Resend Reset Email
                </button>
              )}

              {/* Back to Login */}
              <div className="text-center">
                <button
                  onClick={() => switchMode('login')}
                  className="text-sm text-gray-500 font-medium hover:text-gray-700"
                >
                  <ArrowLeft className="w-3 h-3 inline mr-1" /> Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
