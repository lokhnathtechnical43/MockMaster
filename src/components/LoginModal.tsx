'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mail, Shield, ArrowLeft, Loader2, User, Lock, UserPlus, Eye, EyeOff } from 'lucide-react'

interface LoginModalProps {
  error: string
  loginLoading: boolean
  signupLoading: boolean
  guestLoading: boolean
  onLogin: (email: string, password: string) => void
  onSignUp: (email: string, password: string, name: string) => void
  onGuestLogin: () => void
  onClose: () => void
}

export default function LoginModal({
  error,
  loginLoading,
  signupLoading,
  guestLoading,
  onLogin,
  onSignUp,
  onGuestLogin,
  onClose
}: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
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

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" style={{ touchAction: 'manipulation' }}>
      <Card className="w-full max-w-sm border-0 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold">Login to MockMaster</h2>
          </div>

          {mode === 'login' ? (
            /* Login Form */
            <div className="space-y-4">
              <div className="text-center mb-4">
                <img src="/logo.png" alt="MockMaster" className="w-16 h-16 rounded-2xl mx-auto mb-3" />
                <p className="text-sm text-gray-600">Login with your email & password</p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handleLogin}
                disabled={!email || !password || loginLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11 rounded-xl"
              >
                {loginLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" /> Login</>
                )}
              </Button>

              <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                <Shield className="w-3 h-3" />
                <span>Your data is safe with us</span>
              </div>

              {/* Switch to Signup */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-orange-600 font-semibold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">OR</span>
                </div>
              </div>

              {/* Guest Login */}
              <Button
                onClick={onGuestLogin}
                disabled={guestLoading}
                variant="outline"
                className="w-full h-11 rounded-xl border-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
              >
                {guestLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</>
                ) : (
                  <><User className="w-4 h-4 mr-2" /> Continue as Guest</>
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                Guest mode: Take tests & see results instantly.<br/>
                Email login: Save progress across devices.
              </p>
            </div>
          ) : (
            /* Sign Up Form */
            <div className="space-y-4">
              <div className="text-center mb-4">
                <img src="/logo.png" alt="MockMaster" className="w-16 h-16 rounded-2xl mx-auto mb-3" />
                <p className="text-sm text-gray-600">Create your free account</p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handleSignUp}
                disabled={!email || !password || !name || signupLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl"
              >
                {signupLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Sign Up</>
                )}
              </Button>

              <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                <Shield className="w-3 h-3" />
                <span>Your data is safe with us</span>
              </div>

              {/* Switch to Login */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-orange-600 font-semibold hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">OR</span>
                </div>
              </div>

              {/* Guest Login */}
              <Button
                onClick={onGuestLogin}
                disabled={guestLoading}
                variant="outline"
                className="w-full h-11 rounded-xl border-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
              >
                {guestLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</>
                ) : (
                  <><User className="w-4 h-4 mr-2" /> Skip & Continue as Guest</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
