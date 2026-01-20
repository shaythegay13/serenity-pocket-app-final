"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Star, Crown, Zap } from "lucide-react"
import Link from "next/link"

interface SubscriptionCheckProps {
  currentTier: string
  requiredTier: string
  featureName: string
  description?: string
}

const tierIcons = {
  premium: Star,
  premium_plus: Zap,
  elite: Crown
}

const tierNames = {
  premium: "Premium",
  premium_plus: "Premium Plus", 
  elite: "Elite"
}

export function SubscriptionCheck({ 
  currentTier, 
  requiredTier, 
  featureName, 
  description = "This powerful feature is available for paid subscribers only."
}: SubscriptionCheckProps) {
  const hasAccess = currentTier !== "free"

  if (hasAccess) {
    return null // User has access, don't show the paywall
  }

  const Icon = tierIcons[requiredTier as keyof typeof tierIcons] || Star
  const tierName = tierNames[requiredTier as keyof typeof tierNames] || "Premium"

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Upgrade to Unlock {featureName}
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6">
          {description}
        </p>

        <div className="space-y-3">
          <Badge variant="secondary" className="w-full justify-center py-2">
            <Icon className="h-4 w-4 mr-2" />
            {tierName} Required
          </Badge>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/pricing">
                View Subscription Plans
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/home">
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
