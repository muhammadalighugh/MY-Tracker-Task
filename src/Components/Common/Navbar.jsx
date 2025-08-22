import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowRight, Menu, X, ChevronRight } from 'lucide-react'

// Memoized navigation data
const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Product', href: '#product' },
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Company', href: '#about' },
]

// Memoized Logo component
const Logo = React.memo(({ onClick, mobile = false }) => (
  <a href="#" className="group flex items-center" onClick={onClick}>
    <div className="relative">
      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
        <span className="text-white font-bold text-sm">T</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-lg blur-sm opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
    </div>
    <span className="ml-3 text-xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">
      TrackFlow
    </span>
  </a>
))

// Memoized NavLink component
const NavLink = React.memo(({ item, index, onClick, mobile = false }) => {
  const LinkContent = () => (
    <>
      <span className="relative z-10">{item.name}</span>
      {!mobile && (
        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      )}
      {mobile && (
        <>
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 transition-all duration-300 group-hover:translate-x-1" />
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-blue-500 to-purple-600 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center"></div>
        </>
      )}
      <div className={`absolute inset-0 bg-gradient-to-r ${
        mobile
          ? 'from-emerald-500/5 via-blue-500/5 to-purple-500/5'
          : 'from-emerald-500/10 via-blue-500/10 to-purple-500/10'
      } rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
    </>
  )

  if (mobile) {
    return (
      <a
        href={item.href}
        className="group relative flex items-center justify-between px-4 py-4 text-base font-medium text-gray-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-300"
        onClick={onClick}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <LinkContent />
      </a>
    )
  }

  return (
    <a
      href={item.href}
      className="relative group px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
    >
      <LinkContent />
    </a>
  )
})

// Memoized CTA Button
const CTAButton = React.memo(({ onClick, mobile = false, fullWidth = false }) => (
  <a
    href="/signin"
    className={`group relative inline-flex items-center ${
      fullWidth ? 'justify-center w-full' : 'gap-2'
    } px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 ${
      mobile ? 'hover:scale-[1.02]' : 'hover:scale-105'
    } hover:-translate-y-0.5`}
    onClick={onClick}
  >
    <span>Get Started</span>
    {!mobile && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
    {mobile && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
  </a>
))

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollTimeout = useRef(null)

  // Optimized scroll handler with debounce
  const handleScroll = useCallback(() => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      setIsScrolled(window.scrollY > 20)
    }, 10)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  }, [handleScroll])

  // Optimized body overflow handling
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '17px' // Prevent scrollbar jump
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [mobileMenuOpen])

  const handleNavClick = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  return (
    <>
      {/* Header with optimized scroll behavior */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out ${
        isScrolled
          ? 'bg-white/15 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl'
          : 'bg-transparent backdrop-blur-sm'
      }`}>
        <nav className="flex items-center justify-between px-4 py-4 lg:px-8 mx-auto max-w-7xl h-16">
          {/* Logo - Memoized */}
          <div className="flex lg:flex-1">
            <Logo />
          </div>

          {/* Desktop Navigation - Memoized links */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navigation.map((item, index) => (
              <NavLink key={`${item.name}-${index}`} item={item} index={index} />
            ))}
          </div>

          {/* Desktop CTA - Memoized */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <CTAButton />
          </div>

          {/* Mobile Menu Button - Optimized */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="group relative p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu - Optimized with memoized components */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop with optimized click handler */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={handleNavClick}
            aria-hidden="true"
          />

          {/* Sidebar with optimized animations */}
          <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 shadow-2xl lg:hidden transform transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              {/* Header - Memoized */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
                <Logo onClick={handleNavClick} mobile />
                <button
                  type="button"
                  onClick={handleNavClick}
                  className="group p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
                >
                  <span className="sr-only">Close menu</span>
                  <X className="h-6 w-6 transition-transform group-hover:rotate-90" />
                </button>
              </div>

              {/* Navigation Links - Memoized */}
              <div className="flex-1 px-6 py-8 overflow-y-auto">
                <nav className="space-y-2">
                  {navigation.map((item, index) => (
                    <NavLink
                      key={`${item.name}-mobile-${index}`}
                      item={item}
                      index={index}
                      onClick={handleNavClick}
                      mobile
                    />
                  ))}
                </nav>

                {/* Info Section */}
                <div className="mt-12 p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/30">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/20 via-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-600/30">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-md"></div>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-2">Ready to get started?</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Join thousands of users tracking their progress with TrackFlow.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Section - Memoized */}
              <div className="px-6 py-6 border-t border-slate-700/50 bg-slate-800/30">
                <CTAButton onClick={handleNavClick} mobile fullWidth />

                <button
                  onClick={handleNavClick}
                  className="w-full mt-3 px-6 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Learn more about features
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
