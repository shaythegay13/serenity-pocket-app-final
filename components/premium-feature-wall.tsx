"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Sparkles, Brain, Shield } from "lucide-react"

interface PremiumFeatureWallProps {
  title: string
  description: string
  featureName: string
  onUpgrade?: () => void
}

export function PremiumFeatureWall({ 
  title, 
  description, 
  featureName,
  onUpgrade
}: PremiumFeatureWallProps) {
  const router = useRouter()
  const handleUpgrade = onUpgrade || (() => router.push("/pricing"))
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>

      <Card className="p-12 text-center border-amber-500/30" style={{
        background: 'linear-gradient(to bottom right, rgb(251 191 36 / 0.1), rgb(249 115 22 / 0.1))'
      }}>
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-amber-500/20">
            <Lock className="h-12 w-12 text-amber-500" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">Paid Feature</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {featureName} are available on paid plans (Premium, Premium Plus, Elite).
          Upgrade to unlock personalized bet recommendations and analysis.
        </p>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            What you'll get with paid plans (Elite includes more weekly uses):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-lg bg-background/50">
              <Sparkles className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium">AI-Generated Picks</p>
              <p className="text-xs text-muted-foreground mt-1">Straight bets, parlays, and props</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <Brain className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Psychology-Filtered</p>
              <p className="text-xs text-muted-foreground mt-1">Aligned with your emotional state</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <Shield className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Bankroll Optimization</p>
              <p className="text-xs text-muted-foreground mt-1">Personalized stake recommendations</p>
            </div>
          </div>
        </div>
        <Button size="lg" onClick={handleUpgrade} className="bg-amber-500 hover:bg-amber-600 text-white">
          View Subscription Plans
        </Button>
      </Card>
    </div>
  )
}
