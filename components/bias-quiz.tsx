"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

interface BiasScores {
  confirmationBias: number
  lossAversion: number
  anchoringBias: number
  recencyBias: number
  overconfidenceBias: number
  herdMentality: number
}

interface QuizQuestion {
  id: string
  question: string
  options: { value: string; label: string; scores: BiasScores }[]
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "You've won three bets in a row on your favorite team. What's your next move?",
    options: [
      { 
        value: "a", 
        label: "Increase my bet size - I'm on a hot streak", 
        scores: { confirmationBias: 0.4, lossAversion: 0.0, anchoringBias: 0.3, recencyBias: 1.0, overconfidenceBias: 1.0, herdMentality: 0.5 }
      },
      { 
        value: "b", 
        label: "Stick to my betting strategy regardless", 
        scores: { confirmationBias: 0.0, lossAversion: 0.0, anchoringBias: 0.0, recencyBias: 0.0, overconfidenceBias: 0.0, herdMentality: 0.0 }
      },
      { 
        value: "c", 
        label: "Take a break to stay objective", 
        scores: { confirmationBias: 0.0, lossAversion: 1.0, anchoringBias: 0.0, recencyBias: 0.0, overconfidenceBias: 0.0, herdMentality: 0.0 }
      },
      { 
        value: "d", 
        label: "Look for similar matchups to bet on", 
        scores: { confirmationBias: 1.0, lossAversion: 0.1, anchoringBias: 1.0, recencyBias: 1.0, overconfidenceBias: 0.5, herdMentality: 1.0 }
      },
    ],
  },
  {
    id: "q2",
    question: "Odds on a game shift dramatically from -150 to -200 after you researched it. What do you do?",
    options: [
      { 
        value: "a", 
        label: "Bet immediately - still value at my original analysis", 
        scores: { confirmationBias: 1.0, lossAversion: 0.0, anchoringBias: 1.0, recencyBias: 1.0, overconfidenceBias: 1.0, herdMentality: 0.8 }
      },
      { 
        value: "b", 
        label: "Re-analyze with the new information before deciding", 
        scores: { confirmationBias: 0.0, lossAversion: 0.0, anchoringBias: 0.0, recencyBias: 0.0, overconfidenceBias: 0.0, herdMentality: 0.0 }
      },
      { 
        value: "c", 
        label: "Wait for odds to come back to my price", 
        scores: { confirmationBias: 0.4, lossAversion: 0.8, anchoringBias: 1.0, recencyBias: 0.2, overconfidenceBias: 0.3, herdMentality: 0.5 }
      },
      { 
        value: "d", 
        label: "Avoid it - the sharp money knows something", 
        scores: { confirmationBias: 0.1, lossAversion: 1.0, anchoringBias: 0.2, recencyBias: 0.2, overconfidenceBias: 0.0, herdMentality: 1.0 }
      },
    ],
  },
  {
    id: "q3",
    question: "You're down 15% on the week. Your system says the next bet is solid. What do you do?",
    options: [
      { 
        value: "a", 
        label: "Bet bigger to recover losses - I trust my system", 
        scores: { confirmationBias: 1.0, lossAversion: 0.5, anchoringBias: 1.0, recencyBias: 1.0, overconfidenceBias: 1.0, herdMentality: 1.0 }
      },
      { 
        value: "b", 
        label: "Stop betting for the week", 
        scores: { confirmationBias: 0.1, lossAversion: 1.0, anchoringBias: 0.2, recencyBias: 0.5, overconfidenceBias: 0.0, herdMentality: 0.3 }
      },
      { 
        value: "c", 
        label: "Stick to my unit size and follow my plan", 
        scores: { confirmationBias: 0.0, lossAversion: 0.0, anchoringBias: 0.0, recencyBias: 0.0, overconfidenceBias: 0.0, herdMentality: 0.0 }
      },
      { 
        value: "d", 
        label: "Keep betting until I get back to breakeven", 
        scores: { confirmationBias: 1.0, lossAversion: 1.0, anchoringBias: 1.0, recencyBias: 1.0, overconfidenceBias: 0.3, herdMentality: 1.0 }
      },
    ],
  },
  {
    id: "q4",
    question: "All the sports betting influencers are hammering the same bet. What's your reaction?",
    options: [
      { 
        value: "a", 
        label: "Jump on it - can't miss this lock", 
        scores: { confirmationBias: 1.0, lossAversion: 0.2, anchoringBias: 1.0, recencyBias: 1.0, overconfidenceBias: 1.0, herdMentality: 1.0 }
      },
      { 
        value: "b", 
        label: "Research it independently first", 
        scores: { confirmationBias: 0.0, lossAversion: 0.0, anchoringBias: 0.0, recencyBias: 0.0, overconfidenceBias: 0.0, herdMentality: 0.0 }
      },
      { 
        value: "c", 
        label: "Fade it - probably a trap", 
        scores: { confirmationBias: 0.3, lossAversion: 0.2, anchoringBias: 0.1, recencyBias: 0.2, overconfidenceBias: 1.0, herdMentality: 0.1 }
      },
      { 
        value: "d", 
        label: "Make a small bet to be part of it", 
        scores: { confirmationBias: 0.4, lossAversion: 1.0, anchoringBias: 0.5, recencyBias: 0.5, overconfidenceBias: 0.4, herdMentality: 0.9 }
      },
    ],
  },
  {
    id: "q5",
    question: "You find injury news that contradicts your original bet thesis. What do you do?",
    options: [
      { 
        value: "a", 
        label: "Ignore it - my analysis is still solid", 
        scores: { confirmationBias: 1.0, lossAversion: 0.2, anchoringBias: 1.0, recencyBias: 1.0, overconfidenceBias: 1.0, herdMentality: 0.8 }
      },
      { 
        value: "b", 
        label: "Look for more stats that support my bet", 
        scores: { confirmationBias: 1.0, lossAversion: 1.0, anchoringBias: 1.0, recencyBias: 1.0, overconfidenceBias: 0.6, herdMentality: 1.0 }
      },
      { 
        value: "c", 
        label: "Seriously reconsider or hedge my position", 
        scores: { confirmationBias: 0.0, lossAversion: 0.0, anchoringBias: 0.0, recencyBias: 0.0, overconfidenceBias: 0.0, herdMentality: 0.0 }
      },
      { 
        value: "d", 
        label: "Place the bet anyway - injury impact is overstated", 
        scores: { confirmationBias: 0.8, lossAversion: 0.3, anchoringBias: 1.0, recencyBias: 0.7, overconfidenceBias: 0.7, herdMentality: 1.0 }
      },
    ],
  },
]

interface BiasQuizProps {
  onComplete: (results: Record<string, number>) => void
}

export function BiasQuiz({ onComplete }: BiasQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")

  const handleNext = () => {
    if (!selectedAnswer) return

    const newAnswers = { ...answers, [quizQuestions[currentQuestion].id]: selectedAnswer }
    setAnswers(newAnswers)

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer("")
    } else {
      // Calculate results - sum scores across all answers
      const biasScores: Record<string, number> = {
        confirmationBias: 0,
        lossAversion: 0,
        anchoringBias: 0,
        recencyBias: 0,
        overconfidenceBias: 0,
        herdMentality: 0,
      }

      Object.entries(newAnswers).forEach(([questionId, answer]) => {
        const question = quizQuestions.find((q) => q.id === questionId)
        const option = question?.options.find((o) => o.value === answer)
        if (option && option.scores) {
          // Add all bias scores from this answer
          biasScores.confirmationBias += option.scores.confirmationBias
          biasScores.lossAversion += option.scores.lossAversion
          biasScores.anchoringBias += option.scores.anchoringBias
          biasScores.recencyBias += option.scores.recencyBias
          biasScores.overconfidenceBias += option.scores.overconfidenceBias
          biasScores.herdMentality += option.scores.herdMentality
        }
      })

      // Normalize scores to 0-100 (max raw score per bias is 5.0 across 5 questions)
      Object.keys(biasScores).forEach((bias) => {
        biasScores[bias] = Math.min(100, (biasScores[bias] / 5) * 100)
      })

      onComplete(biasScores)
    }
  }

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Question {currentQuestion + 1} of {quizQuestions.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">{quizQuestions[currentQuestion].question}</h3>

          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            <div className="space-y-3">
              {quizQuestions[currentQuestion].options.map((option) => (
                <div 
                  key={option.value} 
                  onClick={() => setSelectedAnswer(option.value)}
                  className={`flex items-start space-x-3 p-5 rounded-lg border-2 transition-all cursor-pointer select-none ${
                    selectedAnswer === option.value 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1.5 pointer-events-none" />
                  <Label htmlFor={option.value} className="cursor-pointer flex-1 font-normal pointer-events-none leading-relaxed">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <Button 
            onClick={handleNext} 
            disabled={!selectedAnswer} 
            className="w-full mt-6" 
            size="lg"
          >
            {currentQuestion < quizQuestions.length - 1 ? "Next Question" : "Complete Quiz"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
