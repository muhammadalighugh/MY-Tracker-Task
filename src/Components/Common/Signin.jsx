import { useState } from 'react';
import { Github, Facebook, Mail, Lock } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';

export default function Signin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle signin logic here
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
        <div className="absolute bottom-1/4 left-1/3 w-32 sm:w-48 md:w-56 lg:w-64 h-32 sm:h-48 md:h-56 lg:h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" 
             style={{ animationDelay: '1s', animationDuration: '5s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] pointer-events-none" />

      {/* Content with relative positioning */}
      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 ">
        <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 p-8 ">
          <div className="text-center mb-8 ">
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="mt-2 text-gray-400">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-500 hover:text-blue-400">
                Sign up
              </a>
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button className="flex items-center justify-center py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <FaGoogle className="mr-2" size={18} />
              <span className="sr-only">Google</span>
            </button>
            <button className="flex items-center justify-center py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <Github className="mr-2" size={18} />
              <span className="sr-only">GitHub</span>
            </button>
            <button className="flex items-center justify-center py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <Facebook className="mr-2" size={18} />
              <span className="sr-only">Facebook</span>
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="mx-4 text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* Signin Form */}
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
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
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
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
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
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}