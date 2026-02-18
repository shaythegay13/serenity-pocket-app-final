'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

// Same core emotions as the authenticated version in emotion-check-in-dialog.tsx
const coreEmotions = [
  {
    id: 'joy',
    label: 'JOY',
    color: '#f59e0b',
    subEmotions: ['Happy', 'Excited', 'Optimistic', 'Grateful', 'Confident', 'Proud', 'Hopeful', 'Content', 'Cheerful', 'Inspired'],
  },
  {
    id: 'calm',
    label: 'CALM',
    color: '#14b8a6',
    subEmotions: ['Peaceful', 'Relaxed', 'Centered', 'Focused', 'Balanced', 'Serene', 'Patient', 'Composed', 'Tranquil', 'Stable'],
  },
  {
    id: 'fear',
    label: 'FEAR',
    color: '#ef4444',
    subEmotions: ['Anxious', 'Worried', 'Nervous', 'Scared', 'Uncertain', 'Panicked', 'Hesitant', 'Overwhelmed', 'Tense', 'Uneasy'],
  },
  {
    id: 'greed',
    label: 'GREED',
    color: '#8b5cf6',
    subEmotions: ['FOMO', 'Euphoric', 'Impulsive', 'Overconfident', 'Eager', 'Craving', 'Obsessed', 'Compulsive', 'Restless', 'Driven'],
  },
  {
    id: 'frustration',
    label: 'FRUSTRATION',
    color: '#f97316',
    subEmotions: ['Angry', 'Irritated', 'Disappointed', 'Impatient', 'Stressed', 'Resentful', 'Annoyed', 'Agitated', 'Bitter', 'Exhausted'],
  },
  {
    id: 'sadness',
    label: 'SADNESS',
    color: '#6366f1',
    subEmotions: ['Down', 'Discouraged', 'Regretful', 'Defeated', 'Helpless', 'Lonely', 'Empty', 'Hopeless', 'Dejected', 'Grief'],
  },
]

interface PublicEmotionCheckInProps {
  anonymousSessionId: string
  onComplete: (data: { emotion: string; intensity: number; phase: string }) => void
}

export function PublicEmotionCheckIn({ anonymousSessionId, onComplete }: PublicEmotionCheckInProps) {
  const [step, setStep] = useState<'core' | 'sub' | 'details' | 'complete'>('core')
  const [selectedCore, setSelectedCore] = useState<typeof coreEmotions[0] | null>(null)
  const [selectedEmotion, setSelectedEmotion] = useState('')
  const [intensity, setIntensity] = useState([5])
  const [phase, setPhase] = useState<'before' | 'during' | 'after'>('before')
  const [context, setContext] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Betting data fields
  const [betAmount, setBetAmount] = useState('')
  const [betOdds, setBetOdds] = useState('')
  const [gameDescription, setGameDescription] = useState('')
  const [isLiveBet, setIsLiveBet] = useState(false)

  const handleCoreSelect = (core: typeof coreEmotions[0]) => {
    setSelectedCore(core)
    setStep('sub')
  }

  const handleSubSelect = (sub: string) => {
    setSelectedEmotion(sub)
    setStep('details')
  }

  const handleSubmit = async () => {
    if (!selectedEmotion || isSubmitting) return
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/public/emotion-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymous_session_id: anonymousSessionId,
          emotion: selectedEmotion,
          intensity: intensity[0],
          phase,
          context: context || undefined,
          bet_amount: betAmount ? parseFloat(betAmount) : undefined,
          bet_odds: betOdds || undefined,
          game_description: gameDescription || undefined,
          is_live_bet: isLiveBet || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save check-in')
      }

      setStep('complete')
      onComplete({ emotion: selectedEmotion, intensity: intensity[0], phase })
    } catch (error) {
      console.error('Check-in error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (step === 'sub') {
      setStep('core')
      setSelectedCore(null)
    } else if (step === 'details') {
      setStep('sub')
      setSelectedEmotion('')
    }
  }

  const handleStartOver = () => {
    setStep('core')
    setSelectedCore(null)
    setSelectedEmotion('')
    setIntensity([5])
    setPhase('before')
    setContext('')
    setBetAmount('')
    setBetOdds('')
    setGameDescription('')
    setIsLiveBet(false)
  }

  // Step 1: Core emotion selection - large colored circles
  if (step === 'core') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white">Select a core emotion</h3>
          <p className="text-gray-400 text-sm">Choose the emotion that best represents how you're feeling</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-4">
          {coreEmotions.map((emotion) => (
            <button
              type="button"
              key={emotion.id}
              onClick={() => handleCoreSelect(emotion)}
              className="group relative aspect-square flex flex-col items-center justify-center rounded-full transition-all hover:scale-105 hover:shadow-xl min-h-[100px] min-w-[100px] md:min-h-[140px] md:min-w-[140px] touch-manipulation active:scale-95"
              style={{ backgroundColor: emotion.color }}
            >
              <div className="absolute inset-2 rounded-full border-50 border-white/40 pointer-events-none" />
              <span className="text-sm md:text-base lg:text-lg font-bold text-white drop-shadow-lg relative z-10 px-2">
                {emotion.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 2: Sub-emotion selection - circular packing layout
  if (step === 'sub' && selectedCore) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </button>
            <div>
              <h3 className="text-2xl font-bold text-white">Refine your emotion</h3>
              <p className="text-gray-400 text-sm">Pick a specific emotion that describes your state</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartOver}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Start Over
          </button>
        </div>

        <div className="flex flex-col items-center justify-center">
          {/* Circular container */}
          <div className="relative w-full max-w-xl aspect-square mx-auto flex items-center justify-center">
            {/* Outer circle boundary */}
            <div
              className="absolute inset-0 rounded-full shadow-2xl"
              style={{ backgroundColor: `${selectedCore.color}15` }}
            />

            {/* 10 circles: 1 center + 9 in ring */}
            <div className="absolute inset-0">
              {selectedCore.subEmotions.map((subEmotion, index) => {
                const parentRadius = 50
                const angleStep = Math.PI / 9
                const sinAngle = Math.sin(angleStep)
                const circleRadiusPercent = parentRadius / (1 / sinAngle + 1)
                const circleDiameter = circleRadiusPercent * 2
                const circleSize = `${circleDiameter}%`

                let x = 0, y = 0

                if (index === 0) {
                  x = 0
                  y = 0
                } else {
                  const ringRadius = circleRadiusPercent / sinAngle
                  const angleIndex = index - 1
                  const angleDegrees = (360 / 9) * angleIndex
                  const angleRadians = (angleDegrees * Math.PI) / 180
                  x = ringRadius * Math.cos(angleRadians - Math.PI / 2)
                  y = ringRadius * Math.sin(angleRadians - Math.PI / 2)
                }

                return (
                  <button
                    type="button"
                    key={subEmotion}
                    onClick={() => handleSubSelect(subEmotion)}
                    className="absolute rounded-full flex items-center justify-center font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:z-10 active:scale-95 touch-manipulation"
                    style={{
                      width: circleSize,
                      aspectRatio: '1',
                      backgroundColor: selectedCore.color,
                      left: `calc(50% + ${x}%)`,
                      top: `calc(50% + ${y}%)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <span className="text-base text-center px-1 leading-tight font-bold">{subEmotion}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-4">Select a specific emotion</p>
        </div>
      </div>
    )
  }

  // Step 3: Details (intensity, phase, betting details, context) - matches authenticated style
  if (step === 'details') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </button>
            <div>
              <h3 className="text-2xl font-bold text-white">Tell us more</h3>
              <p className="text-gray-400 text-sm">Add intensity, phase, and context</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartOver}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Start Over
          </button>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
            {/* Selected emotion display */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">You selected</p>
              <p className="text-2xl font-bold" style={{ color: selectedCore?.color }}>
                {selectedEmotion}
              </p>
              <p className="text-sm text-gray-500">from {selectedCore?.label}</p>
            </div>

            {/* Intensity Slider - 1 to 5, matching authenticated version */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Intensity</Label>
                <span className="text-lg font-bold" style={{ color: selectedCore?.color }}>
                  {intensity[0]}
                </span>
              </div>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 (Mild)</span>
                <span>5 (Intense)</span>
              </div>
            </div>

            {/* Betting Phase */}
            <div className="space-y-3">
              <Label className="text-gray-300">Select Betting Phase</Label>
              <RadioGroup value={phase} onValueChange={(val) => setPhase(val as typeof phase)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="before" id="phase-before" />
                  <Label htmlFor="phase-before" className="cursor-pointer text-gray-300">Before Betting</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="during" id="phase-during" />
                  <Label htmlFor="phase-during" className="cursor-pointer text-gray-300">During Betting</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="after" id="phase-after" />
                  <Label htmlFor="phase-after" className="cursor-pointer text-gray-300">After Betting</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Betting Details */}
            <div className="space-y-3 border-t border-white/10 pt-4">
              <Label className="text-base font-medium text-gray-200">Betting Details</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="betAmount" className="text-sm text-gray-400">Amount Bet ($)</Label>
                  <input
                    id="betAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 50.00"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="betOdds" className="text-sm text-gray-400">Odds (e.g., +110, -110)</Label>
                  <input
                    id="betOdds"
                    type="text"
                    placeholder="e.g. +110"
                    value={betOdds}
                    onChange={(e) => setBetOdds(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameDescription" className="text-sm text-gray-400">Game/Match Description</Label>
                <input
                  id="gameDescription"
                  type="text"
                  placeholder="e.g., Lakers vs Warriors - NBA"
                  value={gameDescription}
                  onChange={(e) => setGameDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Live Bet Toggle */}
              <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="isLiveBet" className="text-sm font-medium text-gray-200 cursor-pointer">
                    Is this a live/in-play bet?
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Live betting can increase impulsivity risk
                  </p>
                </div>
                <button
                  id="isLiveBet"
                  type="button"
                  role="switch"
                  aria-checked={isLiveBet}
                  onClick={() => setIsLiveBet(!isLiveBet)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors touch-manipulation ${isLiveBet ? 'bg-orange-500' : 'bg-gray-600'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${isLiveBet ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>

            {/* Context */}
            <div className="space-y-3">
              <Label className="text-gray-300">Optional context</Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., I was profitable today"
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full min-h-[44px] touch-manipulation"
              style={{ backgroundColor: selectedCore?.color }}
            >
              {isSubmitting ? 'Saving...' : 'Log Emotion'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: Complete
  if (step === 'complete') {
    return (
      <div className="w-full max-w-lg mx-auto text-center">
        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Check-In Complete</h3>
          <p className="text-gray-400 mb-4">
            You're feeling <span className="text-white font-medium">{selectedEmotion}</span> with
            intensity {intensity[0]}/5 ({phase} betting).
          </p>
          <p className="text-sm text-gray-500">
            Emotional awareness is the first step to making better betting decisions.
          </p>
        </div>
      </div>
    )
  }

  return null
}
