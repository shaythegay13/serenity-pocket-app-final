"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Activity, Target, TrendingUp, Shield } from "lucide-react"
import Link from "next/link"
import { FooterPageWrapper } from "@/components/footer-page-wrapper"

export default function HowItWorksPage() {
  return (
    <FooterPageWrapper>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold text-foreground">How PlayMind Labs Works</h1>
          <p className="text-muted-foreground">Behavioral fintech for safer, smarter sports betting</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">1. Instant Profile</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Take a 4-question snapshot to get your initial behavioral profile. See your emotional alignment and suggested safeguards instantly.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-6 w-6 text-green-500" />
              <h3 className="text-xl font-semibold">2. Ethical Safeguards</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We warn during volatility, reduce risky suggestions during tilt, and avoid dark patterns. You stay in control with cooldowns and limits.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-6 w-6 text-blue-500" />
              <h3 className="text-xl font-semibold">3. Live Odds + Analysis</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Compare best lines across books and analyze bets for probability, EV, and trends. Premium tiers unlock deeper analytics.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Target className="h-6 w-6 text-purple-500" />
              <h3 className="text-xl font-semibold">4. AI Suggestions (Apex)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Personalized picks using your history, real-time odds, and emotional metrics. Always filtered for safety and clarity.
            </p>
          </Card>
        </div>

        <Card className="p-6 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <div>
                <h3 className="font-semibold">Ready to try it?</h3>
                <p className="text-sm text-muted-foreground">Start free. Unlock more features as you go.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </FooterPageWrapper>
  )
}
