"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"

export function BreathingExercise() {
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale")
  const [count, setCount] = useState(4)
  const [cycles, setCycles] = useState(0)

  useEffect(() => {
    if (!isActive) return

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev > 1) return prev - 1

        // Move to next phase
        if (phase === "inhale") {
          setPhase("hold")
          return 4
        } else if (phase === "hold") {
          setPhase("exhale")
          return 6
        } else {
          setPhase("inhale")
          setCycles((c) => c + 1)
          return 4
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, phase])

  const handleReset = () => {
    setIsActive(false)
    setPhase("inhale")
    setCount(4)
    setCycles(0)
  }

  const phaseColors = {
    inhale: "from-blue-500/20 to-teal-500/20 border-blue-500/30",
    hold: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    exhale: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  }

  const phaseInstructions = {
    inhale: "Breathe In",
    hold: "Hold",
    exhale: "Breathe Out",
  }

  return (
    <Card className={`p-8 bg-gradient-to-br ${phaseColors[phase]} border-2 transition-all duration-1000`}>
      <div className="flex flex-col items-center space-y-6">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${
              phase === "inhale"
                ? "from-blue-500/30 to-teal-500/30"
                : phase === "hold"
                  ? "from-amber-500/30 to-orange-500/30"
                  : "from-purple-500/30 to-pink-500/30"
            } transition-all duration-1000 ${isActive ? "scale-100" : "scale-75"}`}
            style={{
              transform: isActive
                ? phase === "inhale"
                  ? "scale(1.2)"
                  : phase === "exhale"
                    ? "scale(0.8)"
                    : "scale(1)"
                : "scale(0.75)",
            }}
          />
          <div className="relative z-10 text-center">
            <div className="text-6xl font-bold text-foreground">{count}</div>
            <div className="text-lg text-muted-foreground capitalize">{phaseInstructions[phase]}</div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">Cycles Completed</p>
          <p className="text-2xl font-bold text-foreground">{cycles}</p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setIsActive(!isActive)} size="lg" className="gap-2">
            {isActive ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
          <Button onClick={handleReset} variant="outline" size="lg" className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="text-center max-w-md">
          <p className="text-sm text-muted-foreground">
            Box breathing helps calm your nervous system. Use this before making trading decisions to reduce emotional
            reactivity.
          </p>
        </div>
      </div>
    </Card>
  )
}
