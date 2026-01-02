"use client"

import { useState } from "react"
import { X } from "lucide-react"

const emotions = [
  { id: "joy", label: "JOY", color: "from-yellow-400 to-orange-400" },
  { id: "calm", label: "CALM", color: "from-cyan-400 to-teal-400" },
  { id: "fear", label: "FEAR", color: "from-red-400 to-pink-400" },
  { id: "greed", label: "GREED", color: "from-purple-500 to-violet-500" },
  { id: "frustration", label: "FRUSTRATION", color: "from-orange-500 to-red-500" },
  { id: "sadness", label: "SADNESS", color: "from-blue-500 to-indigo-500" },
]

export function EmotionCheckIn({ onClose, onSelect }: { onClose: () => void; onSelect: (emotion: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (emotionId: string) => {
    setSelected(emotionId)
    setTimeout(() => {
      onSelect(emotionId)
      onClose()
    }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Welcome! Daily Emotion Check-In</h2>
          <p className="mt-1 text-muted-foreground">Select a core emotion</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {emotions.map((emotion) => (
            <button
              key={emotion.id}
              onClick={() => handleSelect(emotion.id)}
              className={`group relative aspect-square rounded-full bg-gradient-to-br ${emotion.color} p-1 transition-all hover:scale-105 ${
                selected === emotion.id ? "scale-105 ring-4 ring-primary" : ""
              }`}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-background/20 to-background/40 backdrop-blur-sm">
                <span className="text-lg font-bold text-white">{emotion.label}</span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Select a core emotion that best represents how you're feeling
        </p>
      </div>
    </div>
  )
}
