import { Goal, ChartNoAxesCombined, Columns3Cog, Zap, GlobeLock , TrendingUp } from 'lucide-react'

const features = [
  {
    name: 'Goal Tracking',
    description: 'Set and monitor your goals with intuitive progress and milestone tracking.',
    icon: Goal ,
  },
  {
    name: 'Analytics Dashboard',
    description: 'Get detailed insights into your progress with beautiful charts and performance metrics.',
    icon: ChartNoAxesCombined,
  },
  {
    name: 'Custon',
    description: 'Create your Custom Trakers , share progress, and achieve goals collectively.',
    icon: Columns3Cog,
  },
  {
    name: 'Smart Insights',
    description: 'AI-powered recommendations to optimize your workflow and boost productivity.',
    icon: Zap,
  },
  {
    name: 'Secure & Private',
    description: 'Your data is encrypted and secure. Privacy-first approach with enterprise-grade security.',
    icon: GlobeLock,
  },
  {
    name: 'Progress Reports',
    description: 'Generate comprehensive reports and track your improvement over time.',
    icon: TrendingUp,
  },
]

export default function Features() {
  return (
    <div id="features" className="py-12 sm:py-12 relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-400">Everything you need</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Powerful features for goal achievement
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Transform your aspirations into achievements with our comprehensive suite of tracking and analytics tools.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="group">
                <div className="relative rounded-2xl bg-white/5 backdrop-blur-sm p-8 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20">
                  <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-white">
                    <div className="rounded-lg bg-indigo-500/20 p-2 ring-1 ring-indigo-500/30 group-hover:ring-indigo-500/50 transition-all duration-300">
                      <feature.icon className="size-6 text-indigo-400" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}