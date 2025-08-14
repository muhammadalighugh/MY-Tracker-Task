import { Check } from 'lucide-react'

const pricing = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for individuals getting started with goal tracking.',
    features: [
      'Up to 5 active goals',
      'Basic progress tracking',
      'Mobile app access',
      'Email notifications',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$12',
    description: 'Ideal for professionals and small teams.',
    features: [
      'Unlimited goals',
      'Advanced analytics',
      'Team collaboration',
      'Priority support',
      'Custom reports',
      'API access',
    ],
    cta: 'Start Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with advanced needs.',
    features: [
      'Everything in Professional',
      'SSO integration',
      'Advanced security',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

export default function Pricing() {
  return (
    <div id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-400">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Choose the right plan for you
          </p>
        </div>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {pricing.map((tier, tierIdx) => (
            <div
              key={tier.name}
              className={`flex flex-col justify-between rounded-3xl p-8 ring-1 xl:p-10 ${
                tier.popular 
                  ? 'bg-white/10 ring-white/20 relative' 
                  : 'bg-white/5 ring-white/10'
              } hover:bg-white/15 transition-all duration-300 backdrop-blur-sm`}
            >
              {tier.popular && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm font-medium text-white text-center">
                  Most popular
                </div>
              )}
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-lg font-semibold leading-8 text-white">{tier.name}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-300">{tier.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-white">{tier.price}</span>
                  {tier.price !== 'Free' && tier.price !== 'Custom' && (
                    <span className="text-sm font-semibold leading-6 text-gray-300">/month</span>
                  )}
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-indigo-400" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="#"
                className={`mt-8 block rounded-xl py-3 px-6 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-200 ${
                  tier.popular
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 hover:shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}