"use client"

import { Flower2, Activity, TrendingDown, AlertCircle, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface SerenityTokenDisplayProps {
  tokens: number
  recentGain?: number
  surveyScore?: number
  surveyLevel?: string
  archetypeName?: string
}

export function SerenityTokenDisplay({ tokens, recentGain, surveyScore, surveyLevel, archetypeName }: SerenityTokenDisplayProps) {
  const [showGain, setShowGain] = useState(false)

  useEffect(() => {
    if (recentGain && recentGain > 0) {
      setShowGain(true)
      setTimeout(() => setShowGain(false), 2000)
    }
  }, [recentGain])

  const getLevelColor = (level: string): string => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'high':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getLevelBgGradient = (level: string): string => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30'
      case 'high':
        return 'bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/30'
      default:
        return 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 border-gray-500/30'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'high':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-blue/10 rounded-full border border-primary/30 shadow-sm">
        <Flower2 className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground">{tokens}</span>
        <span className="text-sm text-muted-foreground">Tokens</span>

        {showGain && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-float-up">
            <span className="text-sm font-bold text-primary">+{recentGain}</span>
          </div>
        )}
      </div>

      {archetypeName ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all hover:scale-105 bg-gradient-to-r from-blue-500/10 to-violet-500/10 border-blue-500/30">
          <Activity className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-medium text-foreground">Archetype:</span>
          <span className="text-xs font-bold text-blue-700">{archetypeName}</span>
        </div>
      ) : (
        surveyScore !== undefined && surveyLevel && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all hover:scale-105 ${getLevelBgGradient(surveyLevel)}`}>
            {getLevelIcon(surveyLevel)}
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-foreground">Risk Level:</span>
              <span className={`text-xs font-bold ${getLevelColor(surveyLevel)}`}>
                {surveyScore}/50
              </span>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              surveyLevel?.toLowerCase() === 'low' ? 'bg-green-600/20 text-green-700' :
              surveyLevel?.toLowerCase() === 'medium' ? 'bg-yellow-600/20 text-yellow-700' :
              'bg-red-600/20 text-red-700'
            }`}>
              {surveyLevel}
            </div>
          </div>
        )
      )}
    </div>
  )
}
