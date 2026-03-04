'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Shield } from 'lucide-react'
import SurveyForm from '@/components/SurveyForm'
import { SURVEY_QUESTIONS, type SurveyAnswer } from '@/types/survey'
import { type ArchetypeDef } from '@/lib/archetypes'
import { type UnifiedSurveyResult } from '@/types/survey.enhanced'

interface SurveyResult {
  score: number
  archetype: ArchetypeDef
  riskLevel?: 'low' | 'moderate' | 'high' | 'problem'
  pgsiScore?: number
}

interface PublicSerenitySurveyProps {
  anonymousSessionId: string
  onComplete: (result: SurveyResult) => void
}

function getRiskLevelDisplay(riskLevel: string | undefined) {
  switch (riskLevel) {
    case 'low':
      return { label: 'Low Risk', color: 'bg-green-500/10 border-green-500/30 text-green-400' }
    case 'moderate':
      return { label: 'Moderate Risk', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' }
    case 'high':
      return { label: 'High Risk', color: 'bg-orange-500/10 border-orange-500/30 text-orange-400' }
    case 'problem':
      return { label: 'Elevated Risk', color: 'bg-red-500/10 border-red-500/30 text-red-400' }
    default:
      return { label: 'Low Risk', color: 'bg-green-500/10 border-green-500/30 text-green-400' }
  }
}

export function PublicSerenitySurvey({ anonymousSessionId, onComplete }: PublicSerenitySurveyProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<SurveyResult | null>(null)

  const handleSubmit = async (responses: SurveyAnswer[]) => {
    setIsSubmitting(true)
    try {
      // Call the hybrid survey API that calculates both serenity and PGSI scores
      const response = await fetch('/api/survey/submit-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          anonymousSessionId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit survey')
      }

      const data = await response.json()
      const results: UnifiedSurveyResult = data.results

      const surveyResult: SurveyResult = {
        score: results.serenityScore,
        archetype: results.archetype,
        riskLevel: results.riskLevel,
        pgsiScore: results.pgsiScore,
      }

      setResult(surveyResult)
      onComplete(surveyResult)
    } catch (error) {
      console.error('Survey submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show results
  if (result) {
    const riskDisplay = getRiskLevelDisplay(result.riskLevel)

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
          <p className="text-sm text-gray-400 mb-4">
            This score helps track your progress and personalizes your experience over time.
          </p>

          {/* Risk Level Badge */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/10">
            <Shield className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Risk Assessment:</span>
            <Badge variant="outline" className={riskDisplay.color}>
              {riskDisplay.label}
            </Badge>
          </div>
        </div>

        {result.archetype.positive && (
          <div className="text-left bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-green-300">
              <span className="font-bold">Strength:</span> {result.archetype.positive}
            </p>
          </div>
        )}
        {result.archetype.negative && (
          <div className="text-left bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-amber-300">
              <span className="font-bold">Watch out for:</span> {result.archetype.negative}
            </p>
          </div>
        )}

        {(result.riskLevel === 'high' || result.riskLevel === 'problem') && (
          <div className="text-left bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-sm text-red-300">
              <span className="font-bold">Support Available:</span> If you're concerned about your gambling habits,
              the National Council on Problem Gambling offers free, confidential support at 1-800-522-4700.
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
