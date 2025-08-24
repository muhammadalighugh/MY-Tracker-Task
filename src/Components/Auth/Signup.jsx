import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { auth, db } from '../../firebase/firebase.config';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  signOut,
  RecaptchaVerifier
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../../layouts/HomeLayout'

// Security configuration constants
const SECURITY_CONFIG = {
  MIN_PASSWORD_LENGTH: 8,
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
  NAME_REGEX: /^[a-zA-Z\s]{2,}$/
};

// Memoized password strength component
const PasswordStrength = React.memo(({ password }) => {
  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };
  const strength = getStrength(password);
  const strengthColor = strength < 2 ? 'bg-red-500' :
                       strength < 4 ? 'bg-yellow-500' : 'bg-green-500';
  return password ? (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Password strength</span>
        <span>{strength}/4</span>
      </div>
      <div className="h-1 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
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
  ) : null;
});

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Initialize reCAPTCHA
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {},
            'expired-callback': () => {}
          });
          setRecaptchaVerifier(verifier);
        }
        setAuthReady(true);
      } catch (error) {
        console.error('Auth initialization error:', error);
        toast.error('Authentication service unavailable. Please try again later.');
      }
    };
    initializeAuth();
    return () => {
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (e) {
          console.error('Error clearing reCAPTCHA:', e);
        }
      }
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Secure form validation
  const validateForm = () => {
    if (!SECURITY_CONFIG.NAME_REGEX.test(formData.name)) {
      toast.error('Please enter a valid name (letters and spaces only)');
      return false;
    }
    if (!SECURITY_CONFIG.EMAIL_REGEX.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters`);
      return false;
    }
    if (!SECURITY_CONFIG.PASSWORD_REGEX.test(formData.password)) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return false;
    }
    return true;
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm() || !authReady) {
      return;
    }
    setIsLoading(true);
    try {
      if (!recaptchaVerifier) {
        throw new Error('Security verification required');
      }
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      await updateProfile(user, {
        displayName: formData.name
      });
      await sendEmailVerification(user);

      // Save user data to Firestore
      const [firstName, ...lastNameArr] = formData.name.split(' ');
      const lastName = lastNameArr.join(' ');
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: formData.name,
        firstName: firstName,
        lastName: lastName,
        role: 'user',
        isAdmin: false,
        status: 'active',
        isPremium: false,
        createdAt: new Date().toISOString(),
        activeTrackers: [],
        customTrackers: [],
        timedTasks: []
      });

      toast.success('Account created! Please check your email to verify your account.');
      setTimeout(() => navigate('/verify-email'), 1500);
    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = 'Signup failed';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use. Sign in or reset password to continue';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = `Password should be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters`;
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'auth/internal-error':
          errorMessage = 'Authentication service error. Please refresh and try again.';
          break;
        default:
          errorMessage = 'An unknown error occurred';
      }
      toast.error(errorMessage);
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
          const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible'
          });
          setRecaptchaVerifier(newVerifier);
        } catch (e) {
          console.error('reCAPTCHA reset failed:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, navigate, recaptchaVerifier, authReady]);

  const handleGoogleSignup = useCallback(async () => {
    if (!authReady) {
      toast.error('Authentication service not ready. Please try again.');
      return;
    }
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      if (!user.displayName) {
        await updateProfile(user, {
          displayName: user.email.split('@')[0]
        });
      }

      // Save user data to Firestore
      const name = user.displayName || user.email.split('@')[0];
      const [firstName, ...lastNameArr] = name.split(' ');
      const lastName = lastNameArr.join(' ');
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: name,
        firstName: firstName,
        lastName: lastName,
        role: 'user',
        isAdmin: false,
        status: 'active',
        isPremium: false,
        createdAt: new Date().toISOString(),
        activeTrackers: [],
        customTrackers: [],
        timedTasks: []
      });

      if (user.emailVerified) {
        toast.success('Signed up with Google! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        await sendEmailVerification(user);
        toast.success('Account created with Google! Please check your email to verify your account.');
        setTimeout(() => navigate('/verify-email'), 1500);
      }
    } catch (error) {
      console.error('Google signup error:', error);
      let errorMessage = 'Google signup failed';
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Signup popup was closed';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Signup cancelled';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Account already exists with different credentials';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'An unknown error occurred';
      }
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [navigate, authReady]);

  return (
    <HomeLayout>
      <div className="relative isolate lg:mt-7 text-white">
        <div id="recaptcha-container" className="hidden"></div>
        <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] pointer-events-none" />
        <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md backdrop-blur-xl border border-gray-700/50 rounded-xl p-8 shadow-2xl relative overflow-hidden">
            {/* Glass effect overlay */}
            <div className="absolute inset-0 bg-gray/10 rounded-xl" />
            <div className="absolute inset-0 bg-gray-900/40 rounded-xl" />

            {/* Content */}
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4 gap-x-3">
                  <div className="bg-blue-600/20 backdrop-blur-sm p-3 rounded-full border border-blue-500/30 flex items-center justify-center">
                    <UserPlus className="text-blue-400" size={24} />
                  </div>
                  <h2 className="text-3xl font-bold text-center font-serif">Create Account</h2>
                </div>

                <p className="mt-2 text-gray-400 font-serif">
                  Already have an account?{' '}
                  <a href="/signin" className="text-blue-500 hover:text-blue-400 font-serif">
                    Sign in
                  </a>
                </p>
              </div>
              
              <div className="mb-6">
                <button
                  onClick={handleGoogleSignup}
                  disabled={isGoogleLoading || !authReady}
                  className="w-full flex items-center justify-center py-2 px-4 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/50"
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
                    <div className="flex items-center font-serif">
                      <FaGoogle className="mr-2" size={18} />
                      Sign up with Google
                    </div>
                  )}
                </button>
              </div>
              
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-600/50"></div>
                <span className="mx-4 text-gray-400">or</span>
                <div className="flex-grow border-t border-gray-600/50"></div>
              </div>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    disabled={isLoading || !authReady}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                    disabled={isLoading || !authReady}
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    disabled={isLoading || !authReady}
                    autoComplete="new-password"
                  />
                  <PasswordStrength password={formData.password} />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    disabled={isLoading || !authReady}
                    autoComplete="off"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 bg-gray-800/50 border-gray-600/50 rounded focus:ring-blue-500"
                    disabled={isLoading || !authReady}
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                    I agree to the{' '}
                    <a href="#" className="text-blue-500 hover:text-blue-400">
                      Terms and Conditions
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !authReady}
                  className="w-full py-3 px-4 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/80 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center border border-blue-500/30"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2" size={18} />
                      Create Account
                    </>
                  )}
                </button>

                {!authReady && (
                  <div className="mt-4 p-3 bg-blue-900/30 backdrop-blur-sm rounded-lg text-blue-200 text-sm text-center border border-blue-700/50">
                    Initializing authentication service...
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}