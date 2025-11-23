"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers"
import Link from "next/link"

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold text-foreground">Pricing</h1>
        <p className="text-muted-foreground">Pick the plan that matches your goals. Start free.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SUBSCRIPTION_TIERS.map((tier) => (
          <Card key={tier.id} className="p-6">
            <div className="text-center space-y-2 mb-4">
              <h3 className="text-xl font-bold">{tier.displayName}</h3>
              <div className="text-3xl font-bold">{tier.price === 0 ? "Free" : `$${tier.price}`}<span className="text-sm font-normal text-muted-foreground">/{tier.interval}</span></div>
              <p className="text-sm text-muted-foreground min-h-[48px]">{tier.description}</p>
            </div>
            <div className="space-y-2">
              {tier.features.slice(0, 8).map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span>•</span>
                  <span>{f}</span>
                </div>
              ))}
              {tier.features.length > 8 && (
                <Badge variant="outline" className="mt-2">+ more</Badge>
              )}
            </div>
            <div className="pt-4">
              <Button className="w-full" asChild>
                <Link href="/login">{tier.price === 0 ? "Get Started" : "Upgrade"}</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 mt-8">
        <p className="text-center text-sm text-muted-foreground">
          All plans follow responsible use principles. You can change plans anytime.
        </p>
      </Card>
    </div>
  )
}
