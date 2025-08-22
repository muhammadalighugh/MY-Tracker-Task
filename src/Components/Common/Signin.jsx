import { useState, useEffect, useCallback, useRef } from 'react'
import { Mail, Lock } from 'lucide-react'
import { FaGoogle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../../firebase/firebase.config'

// Security configuration
const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000 // 15 minutes
}

export default function Signin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lastAttemptTime, setLastAttemptTime] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const navigate = useNavigate()

  // Initialize Firebase Auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verify auth is properly initialized
        if (!auth || !auth.app) {
          toast.error('Authentication service unavailable. Please try again later.')
          return
        }

        setAuthReady(true)
      } catch (error) {
        toast.error('Authentication service unavailable. Please try again later.')
      }
    }

    initializeAuth()

    // Check auth state for redirect
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard')
      }
    })

    return () => unsubscribe()
  }, [])

  // Check lockout status
  useEffect(() => {
    if (failedAttempts >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - lastAttemptTime
      if (timeSinceLastAttempt < SECURITY_CONFIG.LOCKOUT_TIME) {
        setIsLocked(true)
      } else {
        setIsLocked(false)
        setFailedAttempts(0)
      }
    }
  }, [failedAttempts, lastAttemptTime])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const validatePassword = (password) => {
    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) return false
    if (!/[A-Z]/.test(password)) return false
    if (!/[0-9]/.test(password)) return false
    if (!/[^A-Za-z0-9]/.test(password)) return false
    return true
  }

  const validateEmail = (email) => {
    return SECURITY_CONFIG.EMAIL_REGEX.test(email)
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    if (isLocked) {
      toast.error('Account temporarily locked due to too many failed attempts.')
      return
    }

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!validatePassword(formData.password)) {
      toast.error('Password must be at least 8 characters with uppercase, number, and special character')
      return
    }

    if (!authReady) {
      toast.error('Authentication service not ready. Please try again.')
      return
    }

    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      const user = userCredential.user

      if (!user.emailVerified) {
        await signOut(auth)
        toast.error('Please verify your email before signing in.')
        setTimeout(() => navigate('/verify-email'), 1500)
        return
      }

      toast.success('Successfully signed in! Redirecting...')
      setTimeout(() => navigate('/dashboard'), 1500)
      setFailedAttempts(0)

    } catch (error) {
      setFailedAttempts(prev => prev + 1)
      setLastAttemptTime(Date.now())

      let errorMessage = 'Sign in failed. Please try again.'

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format'
          break
        case 'auth/user-disabled':
          errorMessage = 'Account disabled'
          break
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.'
          break
        case 'auth/internal-error':
          errorMessage = 'Authentication service error. Please refresh and try again.'
          break
        default:
          errorMessage = 'Sign in failed. Please try again.'
      }

      toast.error(errorMessage)
      setFormData(prev => ({ ...prev, password: '' }))
    } finally {
      setLoading(false)
    }
  }, [formData, navigate, authReady, isLocked])

  const handleGoogleSignin = useCallback(async () => {
    if (isLocked) {
      toast.error('Account temporarily locked due to too many failed attempts.')
      return
    }

    if (!authReady) {
      toast.error('Authentication service not ready. Please try again.')
      return
    }

    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      const result = await signInWithPopup(auth, provider)
      
      // Check if email is verified (Google always verifies emails)
      if (!result.user.emailVerified) {
        await signOut(auth)
        toast.error('Please verify your email before signing in.')
        return
      }

      toast.success('Successfully signed in with Google!')
      // Navigation will be handled by the onAuthStateChanged listener

    } catch (error) {
      let errorMessage = 'Google sign in failed. Please try again.'

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google sign in was cancelled'
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups for this site.'
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.'
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isLocked, authReady])

  const getPasswordStrength = (password) => {
    if (password.length === 0) return 0
    let strength = Math.min(password.length / 2, 2)

    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    return Math.min(strength, 5)
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthColor = passwordStrength < 2 ? 'bg-red-500' :
                       passwordStrength < 4 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="relative isolate min-h-screen bg-black text-white overflow-hidden">
      {/* Security background */}
      <div className="fixed inset-0 opacity-30 transition-all duration-700 ease-out pointer-events-none"
           style={{
             background: `radial-gradient(circle at 50% 50%,
               rgba(16, 185, 129, 0.15) 0%,
               rgba(59, 130, 246, 0.10) 35%,
               rgba(147, 51, 234, 0.05) 70%,
               transparent 100%)`
           }} />

      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-64 md:w-80 lg:w-96 h-48 sm:h-64 md:h-80 lg:h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"
             style={{ animationDelay: '0s', animationDuration: '4s' }} />
        <div className="absolute top-3/4 right-1/4 w-40 sm:w-56 md:w-72 lg:w-80 h-40 sm:h-56 md:h-72 lg:h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
             style={{ animationDelay: '2s', animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-32 sm:w-48 md:w-56 h-32 sm:h-48 md:h-56 lg:h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
             style={{ animationDelay: '1s', animationDuration: '5s' }} />
      </div>

      <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">Sign In</h2>
            <p className="mt-2 text-gray-400">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-500 hover:text-blue-400">
                Sign up
              </a>
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={handleGoogleSignin}
              disabled={loading || isLocked || !authReady}
              className="w-full flex items-center justify-center py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <FaGoogle className="mr-2" size={18} />
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="mx-4 text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-500" size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                  disabled={loading || isLocked || !authReady}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-500" size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading || isLocked || !authReady}
                />
              </div>

              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Password strength</span>
                    <span>{passwordStrength}/5</span>
                  </div>
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthColor} transition-all duration-300`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                  disabled={loading || isLocked || !authReady}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="/forgot-password" className="text-blue-500 hover:text-blue-400">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isLocked || !authReady}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>

            {isLocked && (
              <div className="mt-4 p-3 bg-yellow-900/30 rounded-lg text-yellow-200 text-sm text-center">
                Account temporarily locked due to too many failed attempts. Please try again later.
              </div>
            )}

            {!authReady && (
              <div className="mt-4 p-3 bg-blue-900/30 rounded-lg text-blue-200 text-sm text-center">
                Initializing authentication service...
              </div>
            )}
          </form>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>We use industry-standard encryption to protect your data.</p>
            <p className="mt-1">Never share your password with anyone.</p>
          </div>
        </div>
      </div>
    </div>
  )
}