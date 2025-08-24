import { useState, useEffect } from 'react';
import { Home, ArrowLeft, Search, RefreshCw } from "lucide-react";

function NotFoundPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGoBack = () => {
    window.history.back();
  };
  
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="relative isolate min-h-screen bg-black text-white overflow-hidden">
      {/* Dynamic Background with Mouse Interaction */}
      <div 
        className="fixed inset-0 opacity-30 transition-all duration-700 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%,
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

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-2xl w-full">
          {/* Main Glass Card */}
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            
            <div className="relative p-8 md:p-12 text-center">
              {/* Robot Avatar */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300 shadow-2xl shadow-emerald-500/20">
                    {/* Robot Face */}
                    <div className="text-white">
                      <div className="flex justify-center mb-2">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 bg-cyan-300 rounded-full animate-pulse"></div>
                          <div className="w-3 h-3 bg-cyan-300 rounded-full animate-pulse delay-75"></div>
                        </div>
                      </div>
                      <div className="w-8 h-6 bg-white bg-opacity-20 rounded-full mb-2"></div>
                      <div className="flex justify-center">
                        <div className="w-1 h-1 bg-cyan-300 rounded-full mx-1"></div>
                        <div className="w-1 h-1 bg-cyan-300 rounded-full mx-1"></div>
                        <div className="w-1 h-1 bg-cyan-300 rounded-full mx-1"></div>
                      </div>
                    </div>
                  </div>
                  {/* Floating particles */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="absolute -bottom-1 -left-2 w-3 h-3 bg-pink-400 rounded-full animate-ping"></div>
                </div>
              </div>

              {/* Error Code */}
              <div className="mb-6">
                <span className="text-8xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                  404
                </span>
              </div>

              {/* Robot Message */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                  Oops! I can't find that page
                </h1>
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                  <p className="text-lg text-gray-200 italic">
                    "Beep boop! 🤖 My circuits have searched everywhere, but this page seems to have vanished into the digital void. Don't worry though - I'm here to help you get back on track!"
                  </p>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  The page you're looking for might have been moved, deleted, or the URL was typed incorrectly. 
                  Let's get you back to where you need to be.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  onClick={handleGoBack}
                  className="group flex items-center justify-center gap-3 px-8 py-4 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold hover:border-white/30"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                  Go Back
                </button>

                <button
                  onClick={handleGoHome}
                  className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transform hover:-translate-y-0.5"
                >
                  <Home size={20} className="group-hover:scale-110 transition-transform" />
                  Back to Home
                </button>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-white/10 pt-8">
                <p className="text-sm text-gray-400 mb-4">Quick Actions:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-emerald-400 transition-colors backdrop-blur-sm bg-white/5 rounded-lg border border-white/10 hover:border-emerald-500/30"
                  >
                    <RefreshCw size={16} />
                    Refresh Page
                  </button>
                  <a
                    href="/search"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-emerald-400 transition-colors backdrop-blur-sm bg-white/5 rounded-lg border border-white/10 hover:border-emerald-500/30"
                  >
                    <Search size={16} />
                    Search Site
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Support Glass Card */}
          <div className="mt-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-2xl pointer-events-none" />
            <div className="relative">
              <p className="text-sm text-gray-300 mb-2">
                Still having trouble? Our support team is here to help!
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <a
                  href="mailto:info@amigsol.com"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline transition-colors"
                >
                  📧 Email Support
                </a>
                <a
                  href="/help"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline transition-colors"
                >
                  📚 Help Center
                </a>
                <a
                  href="/contact"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline transition-colors"
                >
                  💬 Live Chat
                </a>
              </div>
            </div>
          </div>

          {/* Additional Info Glass Card */}
          <div className="mt-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-emerald-500/5 rounded-2xl pointer-events-none" />
            <div className="relative">
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-white">Pro Tip:</span> Check your bookmarks or try searching for what you need. 
                Most visitors find what they're looking for within seconds! ⚡
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;