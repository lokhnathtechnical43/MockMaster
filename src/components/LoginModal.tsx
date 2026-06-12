'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Phone, Shield, ArrowLeft, Loader2 } from 'lucide-react'

interface LoginModalProps {
  otpSent: boolean
  error: string
  sendingOtp: boolean
  verifyingOtp: boolean
  onSendOtp: (phone: string) => void
  onVerifyOtp: (otp: string) => void
  onReset: () => void
  onClose: () => void
}

export default function LoginModal({
  otpSent,
  error,
  sendingOtp,
  verifyingOtp,
  onSendOtp,
  onVerifyOtp,
  onReset,
  onClose
}: LoginModalProps) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  const handleSendOtp = () => {
    if (phone.length >= 10) {
      onSendOtp(phone)
    }
  }

  const handleVerifyOtp = () => {
    if (otp.length >= 6) {
      onVerifyOtp(otp)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div id="recaptcha-container" />
      <Card className="w-full max-w-sm border-0 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold">Login to ExamPrep Bharat</h2>
          </div>

          {!otpSent ? (
            /* Phone Number Input */
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600">Enter your phone number to login</p>
              </div>

              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1"
                  maxLength={10}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handleSendOtp}
                disabled={phone.length < 10 || sendingOtp}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11 rounded-xl"
              >
                {sendingOtp ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...</>
                ) : (
                  'Send OTP'
                )}
              </Button>

              <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                <Shield className="w-3 h-3" />
                <span>Your number is safe with us</span>
              </div>
            </div>
          ) : (
            /* OTP Verification */
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-600">OTP sent to +91 {phone}</p>
              </div>

              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-widest h-14"
                maxLength={6}
              />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handleVerifyOtp}
                disabled={otp.length < 6 || verifyingOtp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl"
              >
                {verifyingOtp ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <div className="flex items-center justify-between">
                <button
                  onClick={onReset}
                  className="text-sm text-orange-600 hover:underline"
                >
                  Change Number
                </button>
                <button
                  onClick={() => onSendOtp(phone)}
                  className="text-sm text-gray-500 hover:underline"
                  disabled={sendingOtp}
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
