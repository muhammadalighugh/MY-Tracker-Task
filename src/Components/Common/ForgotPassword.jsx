import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Note: Firebase import is commented out as the service is not currently used
// import { auth } from '../../firebase/firebase.config';
// import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Commented-out Firebase password reset logic for future use
  /*
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Please check your inbox or spam folder.');
      setTimeout(() => navigate('/signin'), 1500);
    } catch (error) {
      let errorMessage = 'Failed to send password reset email';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'An error occurred';
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  */

  const handleContactAdmin = () => {
    // Open mail client with pre-filled email
    window.location.href = 'mailto:info@amigsol.com?subject=Password%20Reset%20Request';
  };

  return (
    <div className="relative isolate min-h-screen bg-black text-white overflow-hidden">
      {/* Dynamic Background with Mouse Interaction */}
      <div 
        className="fixed inset-0 opacity-30 transition-all duration-700 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            rgba(16, 185, 129, 0.15) 0%, 
            rgba(59, 130, 246, 0.10) 35%, 
            rgba(147, 51, 234, 0.05) 70%, 
            transparent 100%)`
        }}
      />

      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-64 md:w-80 lg:w-96 h-48 sm:h-64 md:h-80 lg:h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" 
             style={{ animationDelay: '0s', animationDuration: '4s' }} />
        <div className="absolute top-3/4 right-1/4 w-40 sm:w-56 md:w-72 lg:w-80 h-40 sm:h-56 md:h-72 lg:h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" 
             style={{ animationDelay: '2s', animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-32 sm:w-48 md:w-56  h-32 sm:h-48 md:h-56 lg:h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" 
             style={{ animationDelay: '1s', animationDuration: '5s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600/20 p-4 rounded-full">
              <Mail className="text-blue-400" size={40} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Forgot Your Password?</h2>
          <p className="text-gray-300 mb-6">
            We're sorry, but our password reset service is currently unavailable. To reset your password, please contact our admin team by sending an email to{' '}
            <a href="mailto:info@amigsol.com" className="text-blue-500 hover:text-blue-400 font-medium">
              info@amigsol.com
            </a>
            . Our team will assist you promptly.
          </p>
          <button
            onClick={handleContactAdmin}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Contact Admin'
            )}
          </button>
          <p className="mt-6 text-gray-400">
            Back to{' '}
            <a href="/signin" className="text-blue-500 hover:text-blue-400">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}