import { useState, useEffect } from 'react'
import Navbar from '../Components/Common/Navbar'
import Footer from '../Components/Common/Footer'

export default function Layout({ children }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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

    
<div 
  className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.25)_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem] pointer-events-none transition-all duration-300"
  style={{
    WebkitMaskImage: `radial-gradient(200px 200px at ${mousePosition.x}% ${mousePosition.y}%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)`,
    maskImage: `radial-gradient(200px 200px at ${mousePosition.x}% ${mousePosition.y}%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 55%, transparent 100%)`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "cover",
    maskSize: "cover",
  }}
/>


      {/* Main Content */}
      <div className="relative z-10">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
