"use client"

import { Card } from "@/components/ui/card"
import type { BiasProfile } from "@/lib/types"

interface BiasProfileChartProps {
  profile: BiasProfile
}

const biasInfo = {
  confirmationBias: {
    name: "Confirmation Bias",
    description: "Seeking information that confirms existing beliefs",
    color: "#7c3aed",
  },
  lossAversion: {
    name: "Loss Aversion",
    description: "Fear of losses outweighs potential gains",
    color: "#ef4444",
  },
  anchoringBias: {
    name: "Anchoring Bias",
    description: "Over-relying on first piece of information",
    color: "#3b82f6",
  },
  recencyBias: {
    name: "Recency Bias",
    description: "Overweighting recent events",
    color: "#f59e0b",
  },
  overconfidenceBias: {
    name: "Overconfidence Bias",
    description: "Overestimating your knowledge or abilities",
    color: "#14b8a6",
  },
  herdMentality: {
    name: "Herd Mentality",
    description: "Following the crowd without independent analysis",
    color: "#10b981",
  },
}

export function BiasProfileChart({ profile }: BiasProfileChartProps) {
  return (
    <div className="space-y-4">
      {Object.entries(profile).map(([bias, score]) => {
        const info = biasInfo[bias as keyof typeof biasInfo]
        const severity =
          score < 30
            ? { label: "Low", color: "text-green-600" }
            : score < 60
              ? { label: "Moderate", color: "text-amber-600" }
              : { label: "High", color: "text-red-600" }

        return (
          <Card key={bias} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{info.name}</h4>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{Math.round(score)}</div>
                  <div className={`text-xs font-medium ${severity.color}`}>{severity.label}</div>
                </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${score}%`,
                    backgroundColor: info.color,
                  }}
                />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
