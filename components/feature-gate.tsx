"use client"

import { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import { canAccessFeature, getUpgradeMessage } from "@/lib/subscription-tiers"

interface FeatureGateProps {
  currentTier: "free" | "premium" | "premium_plus" | "elite"
  requiredTier: "free" | "premium" | "premium_plus" | "elite"
  featureName: string
  onUpgrade?: () => void
  children: ReactNode
  preview?: ReactNode
}

export function FeatureGate({ currentTier, requiredTier, featureName, onUpgrade, children, preview }: FeatureGateProps) {
  const hasAccess = canAccessFeature(currentTier, requiredTier)

  if (hasAccess) return <>{children}</>

  return (
    <div className="relative">
      <div className="opacity-50 blur-sm pointer-events-none select-none">
        {preview ?? children}
      </div>
      <Card className="absolute inset-0 m-2 flex items-center justify-center bg-background/80 backdrop-blur border-dashed">
        <div className="max-w-md text-center p-6">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Locked Feature</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {getUpgradeMessage(currentTier, featureName)}
          </p>
          <Button onClick={onUpgrade} className="w-full">Upgrade</Button>
        </div>
      </Card>
    </div>
  )
}
