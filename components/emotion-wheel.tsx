"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface EmotionWheelProps {
  onEmotionSelect: (emotion: string, category: string) => void
  selectedEmotion?: string
}

const emotionCategories = {
  joy: {
    color: "#f59e0b",
    emotions: ["Happy", "Excited", "Confident", "Optimistic", "Grateful", "Peaceful"],
  },
  fear: {
    color: "#a78bfa",
    emotions: ["Anxious", "Worried", "Nervous", "Uncertain", "Scared", "Panicked"],
  },
  anger: {
    color: "#ef4444",
    emotions: ["Frustrated", "Irritated", "Angry", "Resentful", "Impatient", "Annoyed"],
  },
  sadness: {
    color: "#3b82f6",
    emotions: ["Sad", "Disappointed", "Discouraged", "Regretful", "Hopeless", "Defeated"],
  },
  surprise: {
    color: "#14b8a6",
    emotions: ["Surprised", "Shocked", "Amazed", "Confused", "Startled", "Curious"],
  },
  disgust: {
    color: "#10b981",
    emotions: ["Disgusted", "Uncomfortable", "Averse", "Repulsed", "Displeased", "Skeptical"],
  },
}

export function EmotionWheel({ onEmotionSelect, selectedEmotion }: EmotionWheelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category)
  }

  const handleEmotionClick = (emotion: string, category: string) => {
    onEmotionSelect(emotion, category)
  }

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(emotionCategories).map(([category, data]) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`p-4 min-h-[80px] rounded-lg border-2 transition-all touch-manipulation ${
              selectedCategory === category
                ? "border-primary bg-primary/10 scale-105"
                : "border-border hover:border-primary/50 hover:bg-muted"
            }`}
            style={{
              borderColor: selectedCategory === category ? data.color : undefined,
            }}
          >
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-2"
                style={{ backgroundColor: data.color, opacity: 0.2 }}
              />
              <p className="font-semibold text-foreground capitalize">{category}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Specific Emotions */}
      {selectedCategory && (
        <Card className="p-6 fade-in">
          <h3 className="text-lg font-semibold text-foreground mb-4 capitalize">
            {selectedCategory} - Choose a specific emotion
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {emotionCategories[selectedCategory as keyof typeof emotionCategories].emotions.map((emotion) => (
              <Button
                key={emotion}
                variant={selectedEmotion === emotion ? "default" : "outline"}
                onClick={() => handleEmotionClick(emotion, selectedCategory)}
                className="w-full"
              >
                {emotion}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
