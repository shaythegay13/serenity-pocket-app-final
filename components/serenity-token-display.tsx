"use client"

import { Flower2 } from "lucide-react"
import { useState, useEffect } from "react"

interface SerenityTokenDisplayProps {
  tokens: number
  recentGain?: number
}

export function SerenityTokenDisplay({ tokens, recentGain }: SerenityTokenDisplayProps) {
  const [showGain, setShowGain] = useState(false)

  useEffect(() => {
    if (recentGain && recentGain > 0) {
      setShowGain(true)
      setTimeout(() => setShowGain(false), 2000)
    }
  }, [recentGain])

  return (
    <div className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-blue/10 rounded-full border border-primary/30">
      <Flower2 className="h-5 w-5 text-primary" />
      <span className="font-semibold text-foreground">{tokens}</span>
      <span className="text-sm text-muted-foreground">Tokens</span>

      {showGain && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-float-up">
          <span className="text-sm font-bold text-primary">+{recentGain}</span>
        </div>
      )}
    </div>
  )
}
