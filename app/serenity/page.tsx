import { Suspense } from 'react'
import { PublicPageHeader } from '@/components/public/public-page-header'
import { SerenityClientSection } from './serenity-client-section'

export default function SerenityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f23] to-[#1a1a2e]">
      <PublicPageHeader />

      {/* SEO-friendly server-rendered content */}
      <section className="pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            Serenity Survey
          </h1>
          <p className="text-xl text-gray-400 text-center max-w-2xl mx-auto mb-12">
            Take our free 12-question assessment to discover your betting archetype and understand
            your risk profile. Get personalized insights to make smarter, safer betting decisions.
          </p>

          <div className="space-y-8 text-gray-300 mb-16">
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">What Is a Betting Archetype?</h2>
              <p>
                Your betting archetype is a psychological profile that describes how you approach
                risk, handle losses, and make decisions under pressure. Just like personality types,
                understanding your archetype helps you leverage your strengths and guard against
                your vulnerabilities as a sports bettor.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">What You'll Learn</h2>
              <p>
                Our assessment evaluates patterns in emotional betting, impulse control, budget
                discipline, and chase behavior. You'll receive your unique archetype, a behavioral
                score, and a risk assessment — all designed to help you understand your betting
                habits and make more disciplined decisions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Research-Backed Assessment</h2>
              <p>
                Our questions are grounded in behavioral science research on decision-making under
                uncertainty and validated problem gambling screening methodologies. The assessment
                takes 2-3 minutes and provides instant, confidential results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive survey */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <Suspense fallback={
            <div className="flex justify-center py-12">
              <div className="animate-pulse text-gray-500">Loading assessment...</div>
            </div>
          }>
            <SerenityClientSection />
          </Suspense>
        </div>
      </section>
    </div>
  )
}
