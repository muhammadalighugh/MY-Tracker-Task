import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { sendEmailVerification, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase.config';
import HomeLayout from '../../layouts/HomeLayout';

export default function VerifyEmail() {
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resendAttempts, setResendAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Constants for resend limits and verification polling
  const MAX_ATTEMPTS = 5;
  const ATTEMPT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const RESEND_DELAY = 5 * 60 * 1000; // 5 minutes in milliseconds
  const POLL_INTERVAL = 5000; // 5 seconds
  const MAX_POLL_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    let unsubscribe;
    let pollInterval;

    const initializeUser = () => {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserEmail(user.email);
          const storedAttempts = JSON.parse(localStorage.getItem('emailVerificationAttempts') || '[]');
          setResendAttempts(storedAttempts);
          setIsLoading(false);

          // Start polling for email verification
          const startTime = Date.now();
          pollInterval = setInterval(async () => {
            await user.reload();
            if (user.emailVerified) {
              toast.success('Email verified successfully! Redirecting to sign-in...');
              clearInterval(pollInterval);
              setTimeout(() => navigate('/signin'), 1500);
            } else if (Date.now() - startTime >= MAX_POLL_DURATION) {
              clearInterval(pollInterval);
            }
          }, POLL_INTERVAL);
        } else {
          setIsLoading(false);
          toast.error('User session not found. Redirecting to sign-up...');
          setTimeout(() => navigate('/signup'), 1500);
        }
      });
    };

    initializeUser();

    // Cleanup subscription and interval
    return () => {
      unsubscribe && unsubscribe();
      pollInterval && clearInterval(pollInterval);
    };
  }, [navigate]);

  const canResendEmail = () => {
    const now = Date.now();
    const recentAttempts = resendAttempts.filter(
      (timestamp) => now - timestamp < ATTEMPT_WINDOW
    );

    if (recentAttempts.length >= MAX_ATTEMPTS) {
      return { canResend: false, reason: 'Maximum resend attempts (5) reached. Please try again after 24 hours.' };
    }

    const lastAttempt = recentAttempts[recentAttempts.length - 1];
    if (lastAttempt && now - lastAttempt < RESEND_DELAY) {
      const remainingTime = Math.ceil((RESEND_DELAY - (now - lastAttempt)) / 1000 / 60);
      return { canResend: false, reason: `Please wait ${remainingTime} minute(s) before resending.` };
    }

    return { canResend: true };
  };

  const handleResendEmail = async () => {
    const { canResend, reason } = canResendEmail();
    if (!canResend) {
      toast.error(reason);
      return;
    }

    setIsResending(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        const now = Date.now();
        const updatedAttempts = [...resendAttempts.filter(
          (timestamp) => now - timestamp < ATTEMPT_WINDOW
        ), now];
        setResendAttempts(updatedAttempts);
        localStorage.setItem('emailVerificationAttempts', JSON.stringify(updatedAttempts));
        toast.success('Verification email resent! Please check your inbox or spam folder.');
      } else {
        toast.error('User session not found. Redirecting to sign-up...');
        setTimeout(() => navigate('/signup'), 1500);
      }
    } catch (error) {
      let errorMessage = 'Failed to resend verification email';
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else {
        errorMessage = error.message || 'An unknown error occurred';
      }
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleSignout = async () => {
    try {
      await signOut(auth);
      toast.info('Signed out. Redirecting to sign-up...');
      setTimeout(() => navigate('/signup'), 1500);
    } catch (error) {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <HomeLayout>
        <div className="relative isolate lg:mt-7 text-white">
          <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] pointer-events-none" />
          <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md backdrop-blur-xl border border-gray-700/50 rounded-xl p-8 shadow-2xl relative overflow-hidden">
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gray/10 rounded-xl" />
              <div className="absolute inset-0 bg-gray-900/40 rounded-xl" />
              <div className="relative z-10 text-center">
                <p className="text-gray-300">Loading user data...</p>
              </div>
            </div>
          </div>
        </div>
      </HomeLayout>
    );
  }

  if (!userEmail) {
    return (
      <HomeLayout>
        <div className="relative isolate lg:mt-7 text-white">
          <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] pointer-events-none" />
          <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md backdrop-blur-xl border border-gray-700/50 rounded-xl p-8 shadow-2xl relative overflow-hidden">
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gray/10 rounded-xl" />
              <div className="absolute inset-0 bg-gray-900/40 rounded-xl" />
              <div className="relative z-10 text-center">
                <p className="text-gray-300 mb-6">User session not found. Please sign in or sign up to continue.</p>
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full py-3 px-4 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/80 rounded-lg text-white font-medium transition-colors mb-4 border border-blue-500/30"
                >
                  Go to Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-3 px-4 bg-gray-700/80 backdrop-blur-sm hover:bg-gray-600/80 rounded-lg text-white font-medium transition-colors border border-gray-600/50"
                >
                  Go to Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="relative isolate lg:mt-7 text-white">
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
                    <Mail className="text-blue-400" size={24} />
                  </div>
                  <h2 className="text-3xl font-bold text-center font-serif">Verify Your Email</h2>
                </div>

                <p className="mt-2 text-gray-400 font-serif">
                  Check your inbox to complete verification
                </p>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-600/50 mb-6">
                <p className="text-gray-300 text-center">
                  We've sent a verification link to{' '}
                  <span className="font-medium text-blue-400">{userEmail}</span>
                </p>
                <p className="text-gray-400 text-sm text-center mt-2">
                  Please check your inbox (and spam/junk folder) to verify your account.
                </p>
              </div>

              <div className="text-center mb-6">
                <p className="text-gray-400 mb-4">
                  Didn't receive the email?
                </p>
                <button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full py-3 px-4 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/80 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center border border-blue-500/30"
                >
                  {isResending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2" size={18} />
                      Resend Verification Email
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleSignout}
                className="w-full py-3 px-4 bg-gray-700/80 backdrop-blur-sm hover:bg-gray-600/80 rounded-lg text-white font-medium transition-colors border border-gray-600/50"
              >
                Sign Out
              </button>

              <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <p>Support: info@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}