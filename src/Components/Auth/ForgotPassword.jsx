import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebase.config';
import HomeLayout from '../../layouts/HomeLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    setIsSending(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      toast.success('Password reset email sent! Please check your inbox or spam folder. If you did not receive it, ensure the email is registered.');
      setTimeout(() => navigate('/signin'), 2000);
    } catch (error) {
      let errorMessage = 'Failed to send reset email';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        default:
          errorMessage = `${error.message} (Code: ${error.code})`;
      }
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

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
                  <h2 className="text-3xl font-bold text-center font-serif">Reset Password</h2>
                </div>

                <p className="mt-2 text-gray-400 font-serif">
                  Enter your email to receive a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="you@example.com"
                      disabled={isSending}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-3 px-4 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/80 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center border border-blue-500/30"
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2" size={18} />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/signin')}
                  className="text-blue-500 hover:text-blue-400 font-medium font-serif"
                >
                  Back to Sign In
                </button>
              </div>

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