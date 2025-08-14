export default function Footer() {
    return (
      <footer className="bg-gray-950 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8">
              <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
                TrackFlow
              </span>
              <p className="text-sm leading-6 text-gray-300">
                Empowering individuals and teams to achieve their goals through intelligent progress tracking and insights.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">Features</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">Pricing</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">API</a></li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">Help Center</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">Contact</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">Status</a></li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">About</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">Blog</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">Careers</a></li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">Privacy</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">Terms</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
            <p className="text-xs leading-5 text-gray-400 text-center">
              &copy; 2025 TrackFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    )
  }