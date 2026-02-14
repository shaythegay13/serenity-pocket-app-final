'use client'

import { useState } from 'react'
import { useAnonymousSession } from '@/lib/hooks/use-anonymous-session'
import { PublicPGSISurvey } from '@/components/public/public-pgsi-survey'
import { SignupCTAModal } from '@/components/signup-cta-modal'

export function PGSIClientSection() {
  const { sessionId } = useAnonymousSession()
  const [showCTA, setShowCTA] = useState(false)
  const [resultSummary, setResultSummary] = useState<string | undefined>()

  const handleComplete = (result: { score: number; category: string; color: string; description: string }) => {
    setResultSummary(`PGSI Score: ${result.score} — ${result.category}`)
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
      <PublicPGSISurvey
        anonymousSessionId={sessionId}
        onComplete={handleComplete}
      />
      <SignupCTAModal
        open={showCTA}
        onOpenChange={setShowCTA}
        featureUsed="pgsi-survey"
        resultSummary={resultSummary}
      />
    </>
  )
}
