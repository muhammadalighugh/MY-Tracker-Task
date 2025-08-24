import HomeLayout from '../layouts/HomeLayout'
import HeroSection from '../Components/HomeComponents/HeroSection'
import Features from '../Components/HomeComponents/Features'
import Testimonials from '../Components/HomeComponents/Testimonials'

export default function Home() {
  return (
    <HomeLayout>
      <HeroSection />
      <Features />
      <Testimonials />
    </HomeLayout>
  )
}
