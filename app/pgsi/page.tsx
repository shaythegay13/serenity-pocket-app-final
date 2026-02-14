import { Suspense } from 'react'
import { PublicPageHeader } from '@/components/public/public-page-header'
import { PGSIClientSection } from './pgsi-client-section'

export default function PGSIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f23] to-[#1a1a2e]">
      <PublicPageHeader />

      {/* SEO-friendly server-rendered content */}
      <section className="pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            PGSI Assessment for Sports Bettors
          </h1>
          <p className="text-xl text-gray-400 text-center max-w-2xl mx-auto mb-12">
            Take the Problem Gambling Severity Index adapted for sports betting. A free,
            confidential 9-question assessment to understand your gambling risk level.
          </p>

          <div className="space-y-8 text-gray-300 mb-16">
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">What Is the PGSI?</h2>
              <p>
                The Problem Gambling Severity Index (PGSI) is the most widely used validated screening
                tool for problem gambling worldwide. Our version, the PGSI-SB, is specifically adapted
                for sports betting by Graupensperger & Calhoun (2024), focusing on behaviors and
                consequences unique to sports bettors.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Why Take This Assessment?</h2>
              <p>
                Understanding your risk level is a key part of responsible gambling. The PGSI-SB helps
                you identify whether your betting habits fall into non-problem, low-risk, moderate-risk,
                or problem gambling categories. Early awareness is the best prevention — catching risky
                patterns before they become problems.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Completely Confidential</h2>
              <p>
                Your responses are private. This assessment is for your own self-awareness and is not
                shared with any third parties. If your results suggest elevated risk, we provide links
                to professional support resources including the National Council on Problem Gambling.
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
            <PGSIClientSection />
          </Suspense>
        </div>
      </section>
    </div>
  )
}
