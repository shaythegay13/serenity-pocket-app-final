"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

interface QuizQuestion {
  id: string
  question: string
  options: { value: string; label: string; bias: string; score: number }[]
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "You've made three profitable trades in a row. What's your next move?",
    options: [
      { value: "a", label: "Increase position size - I'm on a hot streak", bias: "recencyBias", score: 3 },
      { value: "b", label: "Stick to my trading plan regardless", bias: "none", score: 0 },
      { value: "c", label: "Take a break to avoid overconfidence", bias: "none", score: 0 },
      { value: "d", label: "Look for similar setups to the winners", bias: "confirmationBias", score: 2 },
    ],
  },
  {
    id: "q2",
    question: "A stock you're watching drops 20% from your initial analysis price. What do you do?",
    options: [
      { value: "a", label: "Buy immediately - it's a great discount", bias: "anchoringBias", score: 3 },
      { value: "b", label: "Re-analyze with fresh eyes before deciding", bias: "none", score: 0 },
      { value: "c", label: "Wait for it to recover to my price", bias: "anchoringBias", score: 2 },
      { value: "d", label: "Avoid it - something must be wrong", bias: "lossAversion", score: 2 },
    ],
  },
  {
    id: "q3",
    question: "You're down 5% on a position. Your analysis says it should recover. What do you do?",
    options: [
      { value: "a", label: "Hold and add more - I'm confident in my analysis", bias: "overconfidenceBias", score: 3 },
      { value: "b", label: "Cut the loss immediately", bias: "lossAversion", score: 2 },
      { value: "c", label: "Review my thesis and set a stop loss", bias: "none", score: 0 },
      { value: "d", label: "Hold until breakeven no matter what", bias: "lossAversion", score: 3 },
    ],
  },
  {
    id: "q4",
    question: "Everyone on social media is talking about a hot stock. What's your reaction?",
    options: [
      { value: "a", label: "Jump in - don't want to miss out", bias: "herdMentality", score: 3 },
      { value: "b", label: "Research it independently first", bias: "none", score: 0 },
      { value: "c", label: "Avoid it - probably too late", bias: "none", score: 0 },
      { value: "d", label: "Buy a small position to test the waters", bias: "herdMentality", score: 2 },
    ],
  },
  {
    id: "q5",
    question: "You find information that contradicts your bullish thesis. What do you do?",
    options: [
      { value: "a", label: "Dismiss it - my analysis is solid", bias: "confirmationBias", score: 3 },
      { value: "b", label: "Seek more information to confirm my view", bias: "confirmationBias", score: 2 },
      { value: "c", label: "Seriously reconsider my position", bias: "none", score: 0 },
      { value: "d", label: "Reduce position size as a precaution", bias: "none", score: 0 },
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
      // Calculate results
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
        if (option && option.bias !== "none") {
          biasScores[option.bias] += option.score
        }
      })

      // Normalize scores to 0-100
      Object.keys(biasScores).forEach((bias) => {
        biasScores[bias] = Math.min(100, (biasScores[bias] / 9) * 100)
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
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedAnswer === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedAnswer(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <Button onClick={handleNext} disabled={!selectedAnswer} className="w-full" size="lg">
          {currentQuestion < quizQuestions.length - 1 ? "Next Question" : "Complete Quiz"}
        </Button>
      </div>
    </Card>
  )
}
