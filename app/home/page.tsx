"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Activity, TrendingUp, Brain } from "lucide-react"

export default function MarketingHomePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <section className="text-center space-y-4 mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight">Serenity Pocket</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          The behavioral fintech companion for safer, smarter sports betting. Emotional awareness + real-time odds + AI insights.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild>
            <Link href="/">Start Instant Profile</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/how-it-works">How It Works</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-6 w-6 text-primary" />
            <h3 className="font-semibold">Behavioral Dashboard</h3>
          </div>
          <p className="text-sm text-muted-foreground">Daily emotional score, tilt alerts, and behavioral insights.</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <h3 className="font-semibold">Live Odds</h3>
          </div>
          <p className="text-sm text-muted-foreground">Best lines across books with visual line movement (premium).</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-6 w-6 text-purple-500" />
            <h3 className="font-semibold">AI Suggestions</h3>
          </div>
          <p className="text-sm text-muted-foreground">Personalized, safeguarded picks (Elite).</p>
        </Card>
      </section>

      <section className="text-center mt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm">Start with an Instant Profile, unlock more later.</span>
        </div>
      </section>
    </div>
  )
}
