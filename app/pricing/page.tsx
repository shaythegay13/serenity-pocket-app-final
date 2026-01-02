"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Users, Zap, Crown, Sparkles } from "lucide-react"
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers"
import Link from "next/link"
import { AuthenticatedLayout } from "@/components/authenticated-layout"

const tierIcons = {
  free: Users,
  premium: Star,
  premium_plus: Zap,
  elite: Crown
}

const tierHighlights = {
  free: "Best value for comprehensive analytics",
  premium: "Great for casual bettors",
  premium_plus: "Best value for comprehensive analytics",
  elite: "Maximum power for professional bettors"
}

// Flowglad subscription codes
const flowgladPrices = {
  free: process.env.FLOWGLAD_PRICE_FREE || 'price_6cXbsVTICmt3urU2qbpYN',
  premium: process.env.FLOWGLAD_PRICE_PREMIUM || 'price_DQeKeAltQmeHPx33T0c5w',
  premium_plus: process.env.FLOWGLAD_PRICE_PREMIUM_PLUS || 'price_TG7ZGJ1PJCLWKtZkyL9bH',
  elite: process.env.FLOWGLAD_PRICE_ELITE || 'price_XD1jjv7lZ9lhkRTGOnr8w'
}

const handleSubscribe = async (tierId: string) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: flowgladPrices[tierId as keyof typeof flowgladPrices],
        tierId: tierId
      }),
    })

    const session = await response.json()
    
    if (session.url) {
      window.location.href = session.url
    } else {
      console.error('No checkout URL returned')
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
  }
}

export default function PricingPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Choose the plan that fits your betting style and goals. All plans include our core responsible gaming features.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-sm">
                No hidden fees
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Cancel anytime
              </Badge>
              <Badge variant="secondary" className="text-sm">
                7-day money-back guarantee
              </Badge>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {SUBSCRIPTION_TIERS.map((tier) => {
              const Icon = tierIcons[tier.id as keyof typeof tierIcons]
              const isPopular = tier.id === 'premium_plus'
              const isElite = tier.id === 'elite'
              
              return (
                <Card 
                  key={tier.id} 
                  className={`relative p-6 ${isPopular ? 'border-primary shadow-lg scale-105' : ''} ${isElite ? 'bg-gradient-to-b from-primary/5 to-background' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  {isElite && (
                    <div className="absolute top-4 right-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-lg ${isElite ? 'bg-primary/20' : 'bg-muted'}`}>
                        <Icon className={`h-6 w-6 ${isElite ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {tier.displayName}
                    </h3>
                    
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-foreground">
                        ${tier.price}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {tier.name}
                    </p>
                    
                    <p className="text-xs text-muted-foreground italic mb-4">
                      {tierHighlights[tier.id as keyof typeof tierHighlights]}
                    </p>
                    
                    <p className="text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full" 
                    variant={tier.id === 'free' ? 'outline' : isElite ? 'default' : isPopular ? 'default' : 'secondary'}
                    onClick={() => handleSubscribe(tier.id)}
                  >
                    {tier.id === 'free' ? 'Get Started' : 'Upgrade Now'}
                  </Button>
                </Card>
              )
            })}
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center">
            <Card className="p-8 bg-muted/50">
              <div className="flex items-center justify-center mb-4">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  7-Day Money-Back Guarantee
                </Badge>
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Try Serenity Pocket Risk-Free
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                We're confident you'll love Serenity Pocket. If you're not completely satisfied within the first 7 days, 
                we'll give you a full refund—no questions asked.
              </p>
              <Button size="lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Get Started Today
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
