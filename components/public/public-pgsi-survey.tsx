'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Shield } from 'lucide-react'
import { PGSI_SB_QUESTIONS, PGSI_SB_THRESHOLDS } from '@/lib/research-anchors'

const RESPONSE_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Sometimes' },
  { value: 2, label: 'Most of the time' },
  { value: 3, label: 'Almost always' },
] as const

function getCategoryFromScore(score: number) {
  if (score === 0) {
    return {
      category: PGSI_SB_THRESHOLDS.NON_PROBLEM.label,
      color: 'green',
      description: 'Your responses indicate no signs of problem gambling behaviors. Keep up the healthy habits!',
    }
  } else if (score <= 2) {
    return {
      category: PGSI_SB_THRESHOLDS.LOW_RISK.label,
      color: 'yellow',
      description: 'Your responses suggest some low-risk gambling behaviors. Stay mindful and continue monitoring your habits.',
    }
  } else if (score <= 7) {
    return {
      category: PGSI_SB_THRESHOLDS.MODERATE_RISK.label,
      color: 'orange',
      description: 'Your responses indicate moderate risk. Consider setting stricter limits and using our responsible gambling tools.',
    }
  } else {
    return {
      category: PGSI_SB_THRESHOLDS.PROBLEM_GAMBLER.label,
      color: 'red',
      description: 'Your responses suggest potential problem gambling. We strongly recommend speaking with a professional counselor.',
    }
  }
}

interface PublicPGSISurveyProps {
  anonymousSessionId: string
  onComplete: (result: { score: number; category: string; color: string; description: string }) => void
}

export function PublicPGSISurvey({ anonymousSessionId, onComplete }: PublicPGSISurveyProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number; category: string; color: string; description: string
  } | null>(null)

  const handleResponse = (questionId: string, value: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentQuestion < PGSI_SB_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const totalScore = Object.values(responses).reduce((sum, val) => sum + val, 0)
      const categoryInfo = getCategoryFromScore(totalScore)

      const formattedResponses = PGSI_SB_QUESTIONS.map((q) => ({
        questionId: q.id,
        questionText: q.text,
        response: responses[q.id] ?? 0,
        subscale: q.subscale,
      }))

      // Save to backend
      await fetch('/api/public/pgsi-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymous_session_id: anonymousSessionId,
          responses: formattedResponses,
          score: totalScore,
          category: categoryInfo.category,
        }),
      })

      const resultData = {
        score: totalScore,
        category: categoryInfo.category,
        color: categoryInfo.color,
        description: categoryInfo.description,
      }
      setResult(resultData)
      onComplete(resultData)
    } catch (error) {
      console.error('PGSI survey error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Results screen
  if (result) {
    return (
      <Card className="w-full max-w-lg mx-auto p-8 bg-gray-900/50 border-gray-700 text-center">
        <div className="mb-6">
          {result.color === 'green' ? (
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : result.color === 'red' ? (
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          ) : (
            <Shield className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          )}
          <h3 className="text-2xl font-bold text-white mb-2">Assessment Complete</h3>
          <p className="text-gray-400">Your PGSI-SB results are ready</p>
        </div>

        <div className={`rounded-xl p-6 mb-6 ${
          result.color === 'green' ? 'bg-green-500/10 border border-green-500/30' :
          result.color === 'yellow' ? 'bg-yellow-500/10 border border-yellow-500/30' :
          result.color === 'orange' ? 'bg-orange-500/10 border border-orange-500/30' :
          'bg-red-500/10 border border-red-500/30'
        }`}>
          <div className="text-sm text-gray-400 mb-2">Your Score</div>
          <div className={`text-5xl font-bold mb-2 ${
            result.color === 'green' ? 'text-green-500' :
            result.color === 'yellow' ? 'text-yellow-500' :
            result.color === 'orange' ? 'text-orange-500' :
            'text-red-500'
          }`}>{result.score}</div>
          <Badge variant="outline" className={`text-base px-4 py-1 ${
            result.color === 'green' ? 'border-green-500 text-green-500' :
            result.color === 'yellow' ? 'border-yellow-500 text-yellow-500' :
            result.color === 'orange' ? 'border-orange-500 text-orange-500' :
            'border-red-500 text-red-500'
          }`}>
            {result.category}
          </Badge>
        </div>

        <p className="text-sm text-gray-400 mb-6">{result.description}</p>

        {(result.color === 'orange' || result.color === 'red') && (
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={() => window.open('https://www.ncpgambling.org/help-treatment/', '_blank')}
          >
            Find Help Resources
          </Button>
        )}

        <p className="text-xs text-gray-500">
          Based on the Problem Gambling Severity Index adapted for Sports Betting (PGSI-SB).
          Validated by Graupensperger & Calhoun (2024).
        </p>
      </Card>
    )
  }

  // Survey in progress
  const question = PGSI_SB_QUESTIONS[currentQuestion]
  const progress = ((currentQuestion + 1) / PGSI_SB_QUESTIONS.length) * 100
  const canProceed = responses[question.id] !== undefined
  const isLastQuestion = currentQuestion === PGSI_SB_QUESTIONS.length - 1
  const allAnswered = PGSI_SB_QUESTIONS.every((q) => responses[q.id] !== undefined)

  return (
    <Card className="w-full max-w-lg mx-auto p-6 bg-gray-900/50 border-gray-700">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Sports Betting Survey</h3>
        <p className="text-sm text-gray-400">
          This validated assessment helps understand your sports betting habits.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Question {currentQuestion + 1} of {PGSI_SB_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <div className="mb-8">
        <Badge variant="secondary" className="mb-3 text-xs">
          {question.subscale === 'problem_behavior' ? 'Problem Behavior' : 'Negative Consequences'}
        </Badge>
        <h4 className="text-lg font-medium text-white mb-6">{question.text}</h4>

        <RadioGroup
          value={responses[question.id]?.toString()}
          onValueChange={(value) => handleResponse(question.id, parseInt(value))}
          className="space-y-3"
        >
          {RESPONSE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center">
              <RadioGroupItem
                value={option.value.toString()}
                id={`${question.id}-${option.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`${question.id}-${option.value}`}
                className="flex-1 flex items-center gap-3 p-4 rounded-lg border border-gray-700 cursor-pointer transition-colors hover:bg-gray-800 peer-data-[state=checked]:bg-blue-500/10 peer-data-[state=checked]:border-blue-500"
              >
                <div className={`h-4 w-4 rounded-full border-2 transition-colors ${
                  responses[question.id] === option.value
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-600'
                }`}>
                  {responses[question.id] === option.value && (
                    <div className="h-full w-full rounded-full flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>
                <span className="text-gray-200">{option.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed} className="flex-1">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex justify-center gap-1.5 mt-6">
        {PGSI_SB_QUESTIONS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentQuestion(idx)}
            className={`h-2 w-2 rounded-full transition-colors ${
              idx === currentQuestion
                ? 'bg-blue-500'
                : responses[PGSI_SB_QUESTIONS[idx].id] !== undefined
                ? 'bg-blue-500/50'
                : 'bg-gray-700'
            }`}
            aria-label={`Go to question ${idx + 1}`}
          />
        ))}
      </div>
    </Card>
  )
}
