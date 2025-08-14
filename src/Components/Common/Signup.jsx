import { useState } from 'react';
import { Github, Facebook } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle signup logic here
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Glass effect container */}
      <div className="w-full max-w-md bg-white/15 backdrop-blur-lg rounded-xl border border-white/40 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
          <p className="mt-2 text-gray-300">
            Already have an account?{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </a>
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button className="flex items-center justify-center py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20">
            <FaGoogle className="mr-2" size={18} />
            <span className="sr-only">Google</span>
          </button>
          <button className="flex items-center justify-center py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20">
            <Github className="mr-2" size={18} />
            <span className="sr-only">GitHub</span>
          </button>
          <button className="flex items-center justify-center py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20">
            <Facebook className="mr-2" size={18} />
            <span className="sr-only">Facebook</span>
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-white/20"></div>
          <span className="mx-4 text-gray-400">or</span>
          <div className="flex-grow border-t border-white/20"></div>
        </div>

        {/* Signup Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {['name', 'email', 'password', 'confirmPassword'].map((field, idx) => (
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
                  field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'
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
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
              I agree to the{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Terms and Conditions
              </a>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
