"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Crown, Star } from "lucide-react"

interface SubscriptionPricingProps {
  currentTier?: "free" | "premium" | "premium_plus" | "elite"
}

export function SubscriptionPricing({ currentTier = "free" }: SubscriptionPricingProps) {
  const tiers = [
    {
      id: "free",
      name: "Foundation",
      price: 0,
      interval: "forever",
      icon: Sparkles,
      color: "text-gray-500",
      description: "Build self-awareness and track your betting behavior to make safer, smarter decisions.",
      features: [
        "Emotion Tracking & Check-ins",
        "Betting History & Performance Tracking",
        "Emotional Wellness Score",
        "Cooldown Mode & Safety Controls",
      ],
    },
    {
      id: "premium",
      name: "Focus",
      price: 19.99,
      interval: "month",
      icon: Zap,
      color: "text-blue-500",
      description: "Real-time sports data, odds comparison, and analytical tools to bet smarter.",
      badge: "7-Day Free Trial",
      features: [
        "Everything in Foundation",
        "Basic Analytics Dashboard",
        "TiltLab Emotional Analysis (1x/week)",
        "SmartSlip AI Picks (1x/week)",
      ],
    },
    {
      id: "premium_plus",
      name: "Mastery",
      price: 39.99,
      interval: "month",
      icon: Crown,
      color: "text-purple-500",
      description: "Combine psychology insights with data analytics to reduce risk and improve outcomes.",
      badge: "Most Popular",
      features: [
        "Everything in Focus",
        "Emotional Volatility Warnings",
        "Behavior-to-Performance Correlation",
        "TiltLab Emotional Analysis (3x/week)",
        "SmartSlip AI Picks (3x/week)",
      ],
    },
    {
      id: "elite",
      name: "Apex",
      price: 79.99,
      interval: "month",
      icon: Star,
      color: "text-amber-500",
      description: "AI-powered picks and analysis tailored to your psychological profile and betting style.",
      features: [
        "Everything in Mastery",
        "Priority Support & Early Feature Access",
        "TiltLab Emotional Analysis (7x/week)",
        "SmartSlip AI Picks (7x/week)",
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Start free and upgrade as you grow. Combine emotional intelligence with data-driven betting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon
          const isCurrentTier = tier.id === currentTier
          const isFree = tier.id === "free"
          const isMostPopular = tier.badge === "Most Popular"

          return (
            <Card
              key={tier.id}
              className={`p-6 relative ${isCurrentTier ? "border-primary border-2 shadow-lg" : ""
                } ${isMostPopular ? "border-purple-500/50" : ""}`}
            >
              {/* Badge */}
              {tier.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {tier.badge}
                </Badge>
              )}

              {/* Current Tier Badge */}
              {isCurrentTier && (
                <Badge variant="outline" className="absolute top-4 right-4">
                  Current
                </Badge>
              )}

              <div className="space-y-4">
                {/* Header */}
                <div className="text-center space-y-2">
                  <Icon className={`h-10 w-10 mx-auto ${tier.color}`} />
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <div className="text-3xl font-bold">
                    {tier.price === 0 ? (
                      "Free"
                    ) : (
                      <>
                        ${tier.price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{tier.interval}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground min-h-[40px]">
                    {tier.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  {isFree ? (
                    <Button variant="outline" className="w-full" disabled={isCurrentTier}>
                      {isCurrentTier ? "Current Plan" : "Get Started"}
                    </Button>
                  ) : (
                    <Button className="w-full" disabled={isCurrentTier}>
                      {isCurrentTier ? "Current Plan" : "Upgrade"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-4 pt-8">
        <h3 className="text-xl font-bold text-center mb-6">Frequently Asked Questions</h3>

        <Card className="p-4">
          <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
          <p className="text-sm text-muted-foreground">
            Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
            and we'll prorate any billing differences.
          </p>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
          <p className="text-sm text-muted-foreground">
            We accept all major credit cards, debit cards, and PayPal. All payments are processed
            securely through Flowglad.
          </p>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-2">Is there a free trial for paid plans?</h4>
          <p className="text-sm text-muted-foreground">
            Yes! Our Focus tier comes with a 7-day free trial so you can experience the advanced
            features before committing.
          </p>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-2">What's the refund policy?</h4>
          <p className="text-sm text-muted-foreground">
            We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied,
            contact us for a full refund.
          </p>
        </Card>
      </div>
    </div>
  )
}
