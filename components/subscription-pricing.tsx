"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Crown } from "lucide-react"

interface SubscriptionPricingProps {
  currentTier?: "free" | "pro" | "elite" | "master"
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
      description: "Get started with essential emotional tracking",
      features: [
        "Daily emotion check-ins",
        "Basic bias recognition",
        "Betting Emotion Tracker",
        "Weekly progress reports",
      ],
      limitations: [
        "Basic analytics only",
      ],
    },
    {
      id: "pro",
      name: "Focus",
      price: 29,
      interval: "month",
      icon: Zap,
      color: "text-blue-500",
      description: "Unlock advanced insights and unlimited tracking",
      badge: "Popular",
      features: [
        "Everything in Foundation",
        "Advanced bias analytics",
        "Personalized bias alerts",
        "Performance correlation analysis",
        "Unlimited active positions",
        "Priority support",
      ],
      comingSoon: true,
    },
    {
      id: "elite",
      name: "Mastery",
      price: 79,
      interval: "month",
      icon: Crown,
      color: "text-purple-500",
      description: "Premium features with AI-powered coaching",
      badge: "Best Value",
      features: [
        "Everything in Focus",
        "AI-powered decision assistant",
        "Real-time emotional pattern alerts",
        "Custom bias profiles & reports",
        "1-on-1 monthly coaching session",
        "Advanced trade psychology modules",
        "Streak recovery support",
        "API access for trading platforms",
      ],
      comingSoon: true,
    },
    {
      id: "master",
      name: "Apex",
      price: 199,
      interval: "month",
      icon: Crown,
      color: "text-amber-500",
      description: "Complete psychological mastery program",
      badge: "Ultimate",
      features: [
        "Everything in Mastery",
        "Weekly 1-on-1 coaching sessions",
        "Custom psychological assessment",
        "Personalized training program",
        "Direct access to sports psychology experts",
        "VIP community & networking",
        "Early access to new features",
        "White-glove support",
      ],
      comingSoon: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Start free and upgrade as you grow. All paid tiers coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon
          const isCurrentTier = tier.id === currentTier
          const isFree = tier.id === "free"

          return (
            <Card
              key={tier.id}
              className={`p-6 relative ${
                isCurrentTier ? "border-primary border-2 shadow-lg" : ""
              } ${tier.badge === "Best Value" ? "border-purple-500/50" : ""}`}
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
                  {tier.limitations?.map((limitation, index) => (
                    <div key={index} className="flex items-start gap-2 opacity-60">
                      <span className="text-sm">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  {isFree ? (
                    <Button variant="outline" className="w-full" disabled={isCurrentTier}>
                      {isCurrentTier ? "Current Plan" : "Get Started"}
                    </Button>
                  ) : tier.comingSoon ? (
                    <Button variant="outline" className="w-full" disabled>
                      Coming Soon
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

      {/* Coming Soon Notice */}
      <Card className="p-6 bg-muted/50">
        <div className="text-center space-y-2">
          <h3 className="font-semibold">Premium Tiers Coming Q2 2025</h3>
          <p className="text-sm text-muted-foreground">
            We're currently perfecting our advanced features and AI coaching capabilities. 
            Join our free tier today and get early access when we launch! 
            <span className="font-semibold text-primary"> Early adopters will receive special founding member pricing.</span>
          </p>
        </div>
      </Card>

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
            When paid tiers launch, we'll offer a 14-day free trial for all premium plans. 
            No credit card required to start.
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
