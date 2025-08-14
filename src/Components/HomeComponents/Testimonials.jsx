import { Star } from 'lucide-react'

const testimonials = [
  {
    content: 'TrackFlow has revolutionized how we track our team goals. The insights are incredible.',
    author: 'Sarah Johnson',
    role: 'Product Manager',
    company: 'TechCorp',
    rating: 5,
  },
  {
    content: 'Simple yet powerful. Finally a tool that actually helps me stay accountable to my goals.',
    author: 'Michael Chen',
    role: 'Entrepreneur',
    company: 'StartupXYZ',
    rating: 5,
  },
  {
    content: 'The analytics dashboard gives us exactly what we need to make data-driven decisions.',
    author: 'Emily Davis',
    role: 'Team Lead',
    company: 'InnovateCo',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-semibold leading-8 tracking-tight text-indigo-400">Testimonials</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Loved by thousands worldwide
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm leading-6 text-gray-300 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-3">
          {testimonials.map((testimonial, idx) => (
            <figure key={idx} className="rounded-2xl bg-white/5 backdrop-blur-sm p-6 shadow-lg ring-1 ring-white/10">
              <blockquote className="text-gray-200">
                <div className="flex gap-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="size-5 fill-indigo-400 text-indigo-400" />
                  ))}
                </div>
                <p>"{testimonial.content}"</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-x-4">
                <div className="size-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400"></div>
                <div>
                  <div className="font-semibold text-white">{testimonial.author}</div>
                  <div className="text-gray-400">{testimonial.role}, {testimonial.company}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  )
}