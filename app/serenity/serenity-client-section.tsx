'use client'

import { useState } from 'react'
import { useAnonymousSession } from '@/lib/hooks/use-anonymous-session'
import { PublicSerenitySurvey } from '@/components/public/public-serenity-survey'
import { SignupCTAModal } from '@/components/signup-cta-modal'
import type { ArchetypeDef } from '@/lib/archetypes'

export function SerenityClientSection() {
  const { sessionId } = useAnonymousSession()
  const [showCTA, setShowCTA] = useState(false)
  const [resultSummary, setResultSummary] = useState<string | undefined>()

  const handleComplete = (result: { score: number; archetype: ArchetypeDef }) => {
    setResultSummary(`Your archetype: "${result.archetype.name}" (Score: ${result.score})`)
    setTimeout(() => setShowCTA(true), 30000)
  }

  if (!sessionId) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-gray-500">Initializing...</div>
      </div>
    )
  }

  return (
    <>
      <PublicSerenitySurvey
        anonymousSessionId={sessionId}
        onComplete={handleComplete}
      />
      <SignupCTAModal
        open={showCTA}
        onOpenChange={setShowCTA}
        featureUsed="serenity-survey"
        resultSummary={resultSummary}
      />
    </>
  )
}
