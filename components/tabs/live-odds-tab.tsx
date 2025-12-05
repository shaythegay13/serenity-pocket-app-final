"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import type { UserData } from "@/lib/types"
import { canAccessFeature, getUpgradeMessage } from "@/lib/subscription-tiers"
import { SportsDashboard } from "@/components/sports-dashboard"

interface LiveOddsTabProps {
  userData: UserData
  onNavigateToTab: (tab: string) => void
}

export function LiveOddsTab({ userData, onNavigateToTab }: LiveOddsTabProps) {
  const hasAccess = canAccessFeature(userData.subscriptionTier || "free", "premium")

  // Non‑premium: show existing upgrade gate
  if (!hasAccess) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Live Odds Comparison</h2>
          <p className="text-muted-foreground">
            Compare real-time odds across all major sportsbooks
          </p>
        </div>

        <Card className="p-12 text-center bg-linear-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-blue-500/20">
              <Lock className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Premium Feature</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {getUpgradeMessage(userData.subscriptionTier || "free", "Live Odds Comparison")}
          </p>
          <Button size="lg" onClick={() => onNavigateToTab("account")}>
            Upgrade to Premium
          </Button>
        </Card>

        {/* Locked users do not see live data without preview mocks */}
      </div>
    )
  }

  // Premium: show the new Sports Dashboard experience
  return <SportsDashboard />
}