import { ArrowRight, Target, TrendingUp, CheckCircle, Calendar, Activity, BarChart3, Zap, Star } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [periodVisible, setPeriodVisible] = useState(false)
  const [hoveredProgress, setHoveredProgress] = useState(null)

  const trackingTexts = [
    { 
      text: 'Reading', 
      color: 'from-emerald-400 to-emerald-600', 
      period: 'Day',
      periodColor: 'from-yellow-300 to-orange-400'
    },
    { 
      text: 'Exercise', 
      color: 'from-blue-400 to-blue-600', 
      period: 'Week',
      periodColor: 'from-orange-300 to-red-400'
    },
    { 
      text: 'Sleep', 
      color: 'from-purple-400 to-purple-600', 
      period: 'Day',
      periodColor: 'from-lime-300 to-green-500'
    },
    { 
      text: 'Hydration', 
      color: 'from-cyan-400 to-cyan-600', 
      period: 'Fortnight',
      periodColor: 'from-orange-600 to-pink-500'
    },
    { 
      text: 'Meditation', 
      color: 'from-orange-400 to-orange-600', 
      period: 'Month',
      periodColor: 'from-teal-500 to-blue-500'
    },
    { 
      text: 'Coding', 
      color: 'from-pink-400 to-pink-600', 
      period: 'Year',
      periodColor: 'from-teal-300 to-teal-500'
    }
  ];

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const typeText = () => {
      const fullText = trackingTexts[currentTextIndex].text
      
      if (isTyping) {
        if (currentText.length < fullText.length) {
          setCurrentText(fullText.slice(0, currentText.length + 1))
          if (currentText.length + 1 === fullText.length) {
            setTimeout(() => setPeriodVisible(true), 200)
          }
        } else {
          setTimeout(() => {
            setIsTyping(false)
            setPeriodVisible(false)
          }, 2000)
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1))
        } else {
          setIsTyping(true)
          setCurrentTextIndex((prev) => (prev + 1) % trackingTexts.length)
        }
      }
    }

    const timer = setTimeout(typeText, isTyping ? 100 : 50)
    return () => clearTimeout(timer)
  }, [currentText, isTyping, currentTextIndex])

  const floatingElements = [
    { icon: Target, delay: 0, color: 'text-emerald-400', position: 'top-4 right-4' },
    { icon: TrendingUp, delay: 0.2, color: 'text-blue-400', position: 'top-20 -right-4' },
    { icon: CheckCircle, delay: 0.4, color: 'text-purple-400', position: 'top-36 right-8' },
    { icon: Calendar, delay: 0.6, color: 'text-orange-400', position: 'top-52 -right-2' },
    { icon: Activity, delay: 0.8, color: 'text-pink-400', position: 'bottom-20 -left-4' },
    { icon: BarChart3, delay: 1.0, color: 'text-cyan-400', position: 'bottom-36 left-8' },
    { icon: Zap, delay: 1.2, color: 'text-yellow-400', position: 'bottom-4 left-4' },
    { icon: Star, delay: 1.4, color: 'text-rose-400', position: 'top-1/2 -left-6' }
  ]

  const progressData = [
    { label: 'Daily Goals', progress: 85, color: 'bg-emerald-500', shadowColor: 'shadow-emerald-500/50', icon: Target },
    { label: 'Weekly Tasks', progress: 72, color: 'bg-blue-500', shadowColor: 'shadow-blue-500/50', icon: Calendar },
    { label: 'Monthly Target', progress: 94, color: 'bg-purple-500', shadowColor: 'shadow-purple-500/50', icon: TrendingUp },
    { label: 'Yearly Vision', progress: 68, color: 'bg-orange-500', shadowColor: 'shadow-orange-500/50', icon: Star }
  ]

  const chartData = Array.from({length: 12}).map((_, i) => ({
    height: Math.random() * 60 + 20,
    value: Math.floor(Math.random() * 100),
    color: `hsl(${120 + (i * 25)}, 70%, 50%)`
  }))

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24">
      <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)]">
        
        {/* Left Side - Text Content */}
        <div className={`flex flex-col justify-center space-y-6 sm:space-y-8 lg:pr-8 order-2 lg:order-1 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>

          {/* Main Headline */}
          <div className="space-y-2 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-white tracking-tight leading-[0.9]">
              <span className={`inline-block animate-fade-in transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}>Track Your</span>
              <br />
              <div className="mt-2 sm:mt-4 space-y-2 sm:space-y-4">
                {/* Main Typewriter Text */}
                <div className="h-[1.1em] relative overflow-hidden">
                  <span 
                    className={`bg-gradient-to-r ${trackingTexts[currentTextIndex].color} bg-clip-text text-transparent font-bold transition-all duration-300`}
                  >
                    {currentText}
                    <span className="animate-pulse">|</span>
                  </span>
                </div>
                
                {/* Second Line: "Every [Period]" */}
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white">
                  Every <span className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold bg-gradient-to-r ${trackingTexts[currentTextIndex].periodColor} bg-clip-text text-transparent transition-all duration-500 ${
                    periodVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
                  }`}>
                    {trackingTexts[currentTextIndex].period}
                  </span>
                </div>
              </div>
            </h1>
          </div>

          {/* Subtitle */}
          <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-2xl transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}>
            Master your goals with intelligent tracking, real-time insights, and 
            <span className="text-emerald-400 font-medium"> data-driven momentum </span> 
            that turns ambition into achievement.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row items-start gap-4 sm:gap-6 transition-all duration-1000 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}>
            <button className="group relative rounded-2xl bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 p-[2px] transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-black w-full sm:w-auto" href="/Signup">
              <span className="block rounded-2xl bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white transition-all duration-300 group-hover:from-emerald-400 group-hover:via-blue-400 group-hover:to-purple-500">
                Start Your Journey Free
                <ArrowRight className="inline-block ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        </div>

        {/* Right Side - Interactive Visual */}
        <div className={`flex justify-center lg:justify-end order-1 lg:order-2 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
        }`}>
          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
            
            {/* Central Dashboard Mock */}
            <div className="relative bg-gradient-to-br from-slate-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-700/50 p-4 sm:p-6 shadow-2xl hover:shadow-3xl hover:border-slate-600/70 transition-all duration-500 group">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Progress Dashboard</div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                {progressData.map((item, index) => (
                  <div 
                    key={index} 
                    className="space-y-2 cursor-pointer hover:scale-[1.02] transition-all duration-300"
                    onMouseEnter={() => setHoveredProgress(index)}
                    onMouseLeave={() => setHoveredProgress(null)}
                  >
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <item.icon size={14} className={`${item.color.replace('bg-', 'text-')} ${hoveredProgress === index ? 'animate-spin' : ''}`} />
                        <span className="text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
                      </div>
                      <span className={`text-gray-400 font-mono transition-all duration-300 ${hoveredProgress === index ? 'text-white scale-110' : ''}`}>
                        {item.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full ${item.color} transition-all duration-1000 ${item.shadowColor} ${hoveredProgress === index ? 'shadow-lg animate-pulse' : ''}`}
                        style={{ 
                          width: `${item.progress}%`,
                          animationDelay: `${index * 0.2}s`,
                          transform: hoveredProgress === index ? 'scaleY(1.2)' : 'scaleY(1)'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Chart */}
              <div className="relative h-20 sm:h-24 md:h-28 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-lg sm:rounded-xl border border-slate-600/30 flex items-end justify-between p-2 sm:p-3 overflow-hidden group-hover:from-emerald-500/20 group-hover:via-blue-500/20 group-hover:to-purple-500/20 transition-all duration-500">
                {/* Animated grid lines */}
                <div className="absolute inset-0 opacity-20">
                  {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="absolute w-full border-t border-gray-600" style={{bottom: `${25 * i}%`}} />
                  ))}
                </div>
                
                {chartData.map((bar, i) => (
                  <div 
                    key={i}
                    className="relative group/bar cursor-pointer"
                  >
                    <div
                      className="bg-gradient-to-t from-emerald-400 via-blue-500 to-purple-500 rounded-t-sm transition-all duration-1000 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50"
                      style={{ 
                        width: '4px',
                        height: `${bar.height}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                      {bar.value}%
                    </div>
                  </div>
                ))}
                
                {/* Animated particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({length: 3}).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-ping"
                      style={{
                        left: `${20 + (i * 30)}%`,
                        bottom: `${30 + (i * 10)}%`,
                        animationDelay: `${i * 1.5}s`,
                        animationDuration: '3s'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
                {[
                  { label: 'Streak', value: '14d', color: 'text-emerald-400' },
                  { label: 'Score', value: '892', color: 'text-blue-400' },
                  { label: 'Rank', value: '#12', color: 'text-purple-400' }
                ].map((stat, index) => (
                  <div key={index} className="text-center p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className={`text-lg sm:text-xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Icons - Responsive positioning */}
            {floatingElements.map((Element, index) => (
              <div
                key={index}
                className={`absolute ${Element.color} ${Element.position} transition-all duration-1000 hover:scale-125 cursor-pointer ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                }`}
                style={{
                  animationDelay: `${Element.delay + 0.5}s`
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-current rounded-full blur-md opacity-30 animate-ping" />
                  <div className="relative bg-slate-800/80 backdrop-blur-sm border border-current/30 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 hover:scale-110 hover:bg-slate-700/80 transition-all duration-300 hover:border-current/60">
                    <Element.icon size={window.innerWidth < 640 ? 16 : 20} />
                  </div>
                </div>
              </div>
            ))}

            {/* Decorative Elements - Responsive */}
            <div className={`absolute -top-3 sm:-top-6 -right-3 sm:-right-6 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full animate-bounce opacity-60 transition-all duration-1000 delay-1000 ${
              isVisible ? 'opacity-60 scale-100' : 'opacity-0 scale-0'
            }`} />
            <div className={`absolute -bottom-3 sm:-bottom-6 -left-3 sm:-left-6 w-6 h-6 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse opacity-60 transition-all duration-1000 delay-1200 ${
              isVisible ? 'opacity-60 scale-100' : 'opacity-0 scale-0'
            }`} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        @media (max-width: 640px) {
          .floating-icons {
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  )
}