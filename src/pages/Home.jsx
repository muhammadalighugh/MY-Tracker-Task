import HomeLayout from '../layouts/HomeLayout'
// import HeroSection from '../Components/HomeComponents/HeroSection'
// import Features from '../Components/HomeComponents/Features'
// import Testimonials from '../Components/HomeComponents/Testimonials'

// export default function Home() {
//   return (
//     <HomeLayout>
//       <HeroSection />
//       <Features />
//       <Testimonials />
//     </HomeLayout>
//   )
// }
import React from "react";

export default function Home() {
  return (
    <HomeLayout>
      <div className="flex items-center justify-center min-h-screen text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Productivity, Redefined
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
            Dear users, we're crafting an all-in-one platform to supercharge your productivity. Track your health, meditation, and mobile usage, take notes, share ideas, and unlock AI-driven insights to optimize your day. Your journey to peak performance starts here.
          </p>
          <p className="text-sm sm:text-base text-gray-400">
            Get ready — launching soon! 🚀
          </p>
          <p className="text-base sm:text-lg text-gray-200">
            For inquiries, contact us at{" "}
            <a
              href="mailto:info@amigsol.com"
              className="text-emerald-400 hover:text-emerald-300 underline transition-colors duration-200"
              aria-label="Email us at info@amigsol.com"
            >
              info@amigsol.com
            </a>
          </p>
        </div>
      </div>
    </HomeLayout>
  );
}