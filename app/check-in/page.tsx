import { Suspense } from 'react'
import { PublicPageHeader } from '@/components/public/public-page-header'
import { CheckInClientSection } from './check-in-client-section'

export default function CheckInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f23] to-[#1a1a2e]">
      <PublicPageHeader />

      {/* SEO-friendly server-rendered content */}
      <section className="pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            Emotional Check-In for Sports Bettors
          </h1>
          <p className="text-xl text-gray-400 text-center max-w-2xl mx-auto mb-12">
            Understanding your emotions is the first step to making smarter betting decisions.
            Take a moment to check in with yourself — no account required.
          </p>

          <div className="space-y-8 text-gray-300 mb-16">
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Why Emotional Awareness Matters</h2>
              <p>
                Research shows that emotions like fear, greed, and frustration are the biggest predictors
                of poor betting decisions. Bettors who track their emotional state before placing bets
                make significantly more disciplined choices. Our check-in tool helps you recognize
                when your mindset might be working against you.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">How It Works</h2>
              <p>
                Select from 6 core emotions — Joy, Calm, Fear, Greed, Frustration, or Sadness — then
                refine your selection from 10 specific sub-emotions. Rate your intensity and note whether
                you're checking in before, during, or after a game. The entire process takes less than
                30 seconds.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">The Science Behind It</h2>
              <p>
                Our emotional framework is based on validated psychological models for affect regulation
                in high-stakes decision-making. By regularly logging your emotional state, you build
                self-awareness patterns that help you avoid tilt, manage FOMO, and bet with discipline
                rather than impulse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive client-side check-in */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <Suspense fallback={
            <div className="flex justify-center py-12">
              <div className="animate-pulse text-gray-500">Loading check-in tool...</div>
            </div>
          }>
            <CheckInClientSection />
          </Suspense>
        </div>
      </section>
    </div>
  )
}
