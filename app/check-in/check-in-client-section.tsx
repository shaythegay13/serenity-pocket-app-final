'use client'

import { useState } from 'react'
import { useAnonymousSession } from '@/lib/hooks/use-anonymous-session'
import { PublicEmotionCheckIn } from '@/components/public/public-emotion-checkin'
import { SignupCTAModal } from '@/components/signup-cta-modal'

export function CheckInClientSection() {
  const { sessionId } = useAnonymousSession()
  const [showCTA, setShowCTA] = useState(false)
  const [completedData, setCompletedData] = useState<{ emotion: string; intensity: number; phase: string } | null>(null)

  const handleComplete = (data: { emotion: string; intensity: number; phase: string }) => {
    setCompletedData(data)
    // Small delay so user can see the completion state before the modal
    setTimeout(() => setShowCTA(true), 1500)
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
      <PublicEmotionCheckIn
        anonymousSessionId={sessionId}
        onComplete={handleComplete}
      />
      <SignupCTAModal
        open={showCTA}
        onOpenChange={setShowCTA}
        featureUsed="check-in"
        resultSummary={completedData ? `You're feeling ${completedData.emotion} (${completedData.intensity}/5) — ${completedData.phase} a game` : undefined}
      />
    </>
  )
}
