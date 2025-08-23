import React , { useState, useCallback, useEffect } from 'react'
import { FaGoogle } from 'react-icons/fa'
import { auth } from '../../firebase/firebase.config'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  signOut,
  RecaptchaVerifier
} from 'firebase/auth'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useNavigate } from 'react-router-dom'

// Security configuration constants
const SECURITY_CONFIG = {
  MIN_PASSWORD_LENGTH: 8,
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
  NAME_REGEX: /^[a-zA-Z\s]{2,}$/
}

// Memoized password strength component
const PasswordStrength = React.memo(({ password }) => {
  const getStrength = (pwd) => {
    if (!pwd) return 0
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  const strength = getStrength(password)
  const strengthColor = strength < 2 ? 'bg-red-500' :
                       strength < 4 ? 'bg-yellow-500' : 'bg-green-500'

  return password ? (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Password strength</span>
        <span>{strength}/4</span>
      </div>
      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${strengthColor} transition-all duration-300`}
          style={{ width: `${(strength / 4) * 100}%` }}
        ></div>
      </div>
      {strength < 4 && password.length > 0 && (
        <p className="mt-1 text-xs text-yellow-500">
          {strength < 2
            ? 'Weak password'
            : 'Add uppercase, numbers, or special characters'}
        </p>
      )}
    </div>
  ) : null
})

export default function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Initialize reCAPTCHA
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {},
            'expired-callback': () => {}
          })
          setRecaptchaVerifier(verifier)
        }
        setAuthReady(true)
      } catch (error) {
        console.error('Auth initialization error:', error)
        toast.error('Authentication service unavailable. Please try again later.')
      }
    }

    initializeAuth()

    return () => {
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear()
        } catch (e) {
          console.error('Error clearing reCAPTCHA:', e)
        }
      }
    }
  }, [])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  // Secure form validation
  const validateForm = () => {
    // Name validation
    if (!SECURITY_CONFIG.NAME_REGEX.test(formData.name)) {
      toast.error('Please enter a valid name (letters and spaces only)')
      return false
    }

    // Email validation
    if (!SECURITY_CONFIG.EMAIL_REGEX.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }

    // Password validation
    if (formData.password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters`)
      return false
    }

    if (!SECURITY_CONFIG.PASSWORD_REGEX.test(formData.password)) {
      toast.error('Password must contain uppercase, lowercase, number, and special character')
      return false
    }

    // Confirm password match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match")
      return false
    }

    return true
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    if (!validateForm() || !authReady) {
      return
    }

    setIsLoading(true)

    try {
      // Verify reCAPTCHA
      if (!recaptchaVerifier) {
        throw new Error('Security verification required')
      }

      // Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: formData.name
      })

      // Send email verification
      await sendEmailVerification(userCredential.user)

      // Sign out to prevent auto-login before verification
      await signOut(auth)

      toast.success('Account created! Please check your email to verify your account.')
      setTimeout(() => navigate('/verify-email'), 1500)

    } catch (error) {
      console.error('Signup error:', error)

      let errorMessage = 'Signup failed'

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use Signin or Forget Passwrord to continue'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address'
          break
        case 'auth/weak-password':
          errorMessage = `Password should be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters`
          break
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.'
          break
        case 'auth/internal-error':
          errorMessage = 'Authentication service error. Please refresh and try again.'
          break
        default:
          errorMessage = 'An unknown error occurred'
      }

      toast.error(errorMessage)

      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear()
          const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible'
          })
          setRecaptchaVerifier(newVerifier)
        } catch (e) {
          console.error('reCAPTCHA reset failed:', e)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [formData, navigate, recaptchaVerifier, authReady])

  const handleGoogleSignup = useCallback(async () => {
    if (!authReady) {
      toast.error('Authentication service not ready. Please try again.')
      return
    }

    setIsGoogleLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      try {
        const userCredential = await signInWithPopup(auth, provider)
        const user = userCredential.user

        // For Google signups, we still want to ensure they have a name
        if (!user.displayName) {
          await updateProfile(user, {
            displayName: user.email.split('@')[0]
          })
        }

        // Check if email is verified (Google accounts are typically verified)
        if (user.emailVerified) {
          toast.success('Signed up with Google! Redirecting...')
          setTimeout(() => navigate('/dashboard'), 1500)
        } else {
          await signOut(auth)
          toast.error('Please verify your email to continue.')
          setTimeout(() => navigate('/verify-email'), 1500)
        }
      } catch (error) {
        console.error('Google signup error:', error)

        let errorMessage = 'Google signup failed'

        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Signup popup was closed'
            break
          case 'auth/cancelled-popup-request':
            errorMessage = 'Signup cancelled'
            break
          case 'auth/account-exists-with-different-credential':
            errorMessage = 'Account already exists with different credentials'
            break
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.'
            break
          default:
            errorMessage = error.message || 'An unknown error occurred'
        }

        toast.error(errorMessage)
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }, [navigate, authReady])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" className="hidden"></div>

      <div className="w-full max-w-md bg-white/15 backdrop-blur-lg rounded-xl border border-white/40 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
          <p className="mt-2 text-gray-300">
            Already have an account?{' '}
            <a href="/signin" className="text-blue-400 hover:text-blue-300">
              Sign in
            </a>
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading || !authReady}
            className={`w-full flex items-center justify-center py-2 px-4 rounded-lg transition-colors border ${
              isGoogleLoading || !authReady
                ? 'bg-white/10 border-white/10 cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 border-white/20'
            }`}
          >
            {isGoogleLoading ? (
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
                Sign up with Google
              </>
            )}
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-white/20"></div>
          <span className="mx-4 text-gray-400">or</span>
          <div className="flex-grow border-t border-white/20"></div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {[
            { field: 'name', type: 'text', placeholder: 'John Doe', label: 'Full Name' },
            { field: 'email', type: 'email', placeholder: 'you@example.com', label: 'Email Address' },
            { field: 'password', type: 'password', placeholder: '••••••••', label: 'Password' },
            { field: 'confirmPassword', type: 'password', placeholder: '••••••••', label: 'Confirm Password' }
          ].map((fieldConfig) => (
            <div key={fieldConfig.field}>
              <label
                htmlFor={fieldConfig.field}
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                {fieldConfig.label}
              </label>
              <input
                id={fieldConfig.field}
                name={fieldConfig.field}
                type={fieldConfig.type}
                required
                value={formData[fieldConfig.field]}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={fieldConfig.placeholder}
                disabled={isLoading || !authReady}
                autoComplete={fieldConfig.field === 'name' ? 'name' :
                             fieldConfig.field === 'email' ? 'username' :
                             fieldConfig.field === 'password' ? 'new-password' : 'off'}
              />
              {fieldConfig.field === 'password' && (
                <PasswordStrength password={formData.password} />
              )}
            </div>
          ))}

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              disabled={isLoading || !authReady}
            />
            <label
              htmlFor="terms"
              className="ml-2 block text-sm text-gray-300"
            >
              I agree to the{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Terms and Conditions
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || !authReady}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading || !authReady
                ? 'bg-blue-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
