import React from "react";
import { Home, ArrowLeft } from "lucide-react";
import HomeLayout from '../layouts/HomeLayout'; // Adjust path based on your project structure

export default function NotFoundPage() {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <HomeLayout>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full text-center">
          <div className="bg-black border-2 border-transparent rounded-xl shadow-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <div className="p-4 sm:p-6 md:p-8">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-3 sm:mb-4">404</h1>
              <div className="flex flex-col items-center mb-4 sm:mb-6">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mb-3 sm:mb-4">
                  <div className="absolute w-full h-full bg-gradient-to-br from-emerald-500/20 to-purple-500/20 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-200 mb-2">Lost in Space</h2>
                <p className="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed px-2 sm:px-0">
                  It seems you've drifted off course. The page you're looking for isn’t here. Let’s get you back to productivity.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4 sm:mb-6">
                <button
                  onClick={handleGoBack}
                  className="flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium text-sm sm:text-base"
                  aria-label="Go back to previous page"
                >
                  <ArrowLeft size={16} sm:size={18} />
                  Go Back
                </button>
                <button
                  onClick={handleGoHome}
                  className="flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2 bg-gradient-to-r from-emerald-600 to-purple-600 text-white rounded-lg hover:from-emerald-700 hover:to-purple-700 transition-all duration-200 font-medium text-sm sm:text-base"
                  aria-label="Return to home page"
                >
                  <Home size={16} sm:size={18} />
                  Back to Home
                </button>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-gray-400">
                Need help navigating? Contact us at{" "}
                <a
                  href="mailto:info@amigsol.com"
                  className="text-emerald-400 hover:text-emerald-300 underline transition-colors duration-200"
                  aria-label="Email support at info@amigsol.com"
                >
                  info@amigsol.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}