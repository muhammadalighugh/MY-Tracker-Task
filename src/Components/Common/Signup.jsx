import { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { auth } from '../../firebase/firebase.config';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast.error("Password should be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });

      toast.success('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      let errorMessage = 'Signup failed';
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        default:
          errorMessage = error.message || 'An unknown error occurred';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      toast.success('Signed up with Google! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      let errorMessage = 'Google signup failed';
      
      // Handle specific Google auth errors
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
        default:
          errorMessage = error.message || 'An unknown error occurred';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
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
            disabled={isGoogleLoading}
            className={`w-full flex items-center justify-center py-2 px-4 rounded-lg transition-colors border ${
              isGoogleLoading
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
                Google
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
          {['name', 'email', 'password', 'confirmPassword'].map((field) => (
            <div key={field}>
              <label
                htmlFor={field}
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                {field === 'name'
                  ? 'Full Name'
                  : field === 'email'
                  ? 'Email Address'
                  : field === 'password'
                  ? 'Password'
                  : 'Confirm Password'}
              </label>
              <input
                id={field}
                name={field}
                type={
                  field.includes('password')
                    ? 'password'
                    : field === 'email'
                    ? 'email'
                    : 'text'
                }
                required
                value={formData[field]}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  field === 'name'
                    ? 'John Doe'
                    : field === 'email'
                    ? 'you@example.com'
                    : '••••••••'
                }
                disabled={isLoading}
              />
            </div>
          ))}

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              disabled={isLoading}
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
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading
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
  );
}