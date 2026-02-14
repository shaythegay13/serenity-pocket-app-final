'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain } from 'lucide-react'
import SurveyForm from '@/components/SurveyForm'
import { SURVEY_QUESTIONS, type SurveyAnswer } from '@/types/survey'
import { computeArchetypeFromSnapshot, type ArchetypeDef } from '@/lib/archetypes'

interface PublicSerenitySurveyProps {
  anonymousSessionId: string
  onComplete: (result: { score: number; archetype: ArchetypeDef }) => void
}

export function PublicSerenitySurvey({ anonymousSessionId, onComplete }: PublicSerenitySurveyProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; archetype: ArchetypeDef } | null>(null)

  const handleSubmit = async (responses: SurveyAnswer[]) => {
    setIsSubmitting(true)
    try {
      // Calculate score client-side
      const score = responses.reduce((acc, r) => {
        const q = SURVEY_QUESTIONS.find((question) => question.id === r.questionId)
        if (!q) return acc
        const idx = q.options.indexOf(r.selectedOption)
        return acc + (idx >= 0 ? q.weight[idx] : 0)
      }, 0)

      // Compute archetype
      const archetype = computeArchetypeFromSnapshot(responses)

      // Persist to backend
      await fetch('/api/public/serenity-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymous_session_id: anonymousSessionId,
          responses,
        }),
      })

      setResult({ score, archetype })
      onComplete({ score, archetype })
    } catch (error) {
      console.error('Survey submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show results
  if (result) {
    return (
      <Card className="w-full max-w-2xl mx-auto p-8 bg-gray-900/50 border-gray-700 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-6 mx-auto">
          <Brain className="h-10 w-10 text-white" />
        </div>

        <h3 className="text-3xl font-bold text-white mb-2">
          You're a{' '}
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            "{result.archetype.name}"
          </span>
        </h3>
        <p className="text-gray-400 text-lg mb-6">{result.archetype.description}</p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="text-2xl font-bold text-white mb-1">Your Score: {result.score}</div>
          <p className="text-sm text-gray-400">
            This score helps track your progress and personalizes your experience over time.
          </p>
        </div>

        {result.archetype.positive && (
          <div className="text-left bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-green-300">
              <span className="font-bold">Strength:</span> {result.archetype.positive}
            </p>
          </div>
        )}
        {result.archetype.negative && (
          <div className="text-left bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-sm text-amber-300">
              <span className="font-bold">Watch out for:</span> {result.archetype.negative}
            </p>
          </div>
        )}
      </Card>
    )
  }

  // Show survey form
  return (
    <Card className="w-full max-w-2xl mx-auto p-8 bg-gray-900/50 border-gray-700">
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Serenity Assessment</h3>
        <p className="text-gray-400">12 questions &middot; 2-3 minutes &middot; Discover your betting archetype</p>
      </div>
      <div className="survey-dark-theme">
        <SurveyForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          questions={SURVEY_QUESTIONS}
        />
      </div>
    </Card>
  )
}
