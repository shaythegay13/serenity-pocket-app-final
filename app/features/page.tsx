import type { Metadata } from "next"
import { BASE_URL } from "@/lib/constants"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, TrendingUp, Brain, Shield, Target } from "lucide-react"
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers"
import { FooterPageWrapper } from "@/components/footer-page-wrapper"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Features - Behavioral Sports Betting Tools | PlayMind Labs",
    description: "Explore PlayMind Labs's powerful features: AI-powered bet analysis, emotion tracking, cognitive bias detection, and personalized SmartSlip picks for responsible betting.",
    openGraph: {
      title: "PlayMind Labs Features - AI-Powered Betting Analytics",
      description: "Discover powerful behavioral tools for smarter, more disciplined betting decisions.",
      url: `${BASE_URL}/features`,
      siteName: "PlayMind Labs",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "PlayMind Labs Features - AI-Powered Betting Analytics",
      description: "Discover powerful behavioral tools for smarter, more disciplined betting decisions.",
    },
    alternates: {
      canonical: `${BASE_URL}/features`,
    },
  }
}

const featuredFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Get personalized betting insights powered by advanced machine learning algorithms that analyze your patterns and behavior.",
    tier: "premium"
  },
  {
    icon: Shield,
    title: "Emotion Tracking",
    description: "Monitor your emotional state and receive alerts when you might be making decisions based on feelings rather than logic.",
    tier: "free"
  },
  {
    icon: Target,
    title: "SmartSlip AI Picks",
    description: "Receive daily AI-powered betting recommendations tailored to your profile and risk tolerance.",
    tier: "premium_plus"
  },
  {
    icon: TrendingUp,
    title: "TiltLab Emotional Analysis",
    description: "Deep behavioral analysis to identify emotional triggers and patterns that affect your betting decisions.",
    tier: "premium_plus"
  }
]

export default function FeaturesPage() {
  return (
    <FooterPageWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Features That Make Smarter Betting Possible
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
              Discover the powerful behavioral and AI tools that make PlayMind Labs the most comprehensive
              responsible betting platform available.
            </p>
          </div>

          {/* Featured Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {featuredFeatures.map((feature, index) => {
              const Icon = feature.icon
              const tier = SUBSCRIPTION_TIERS.find(t => t.id === feature.tier)

              return (
                <Card key={index} className="p-8 relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <Badge variant={feature.tier === 'free' ? 'secondary' : 'default'}>
                      {tier?.displayName}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-6 sm:mb-8">
              Compare All Features
            </h2>

            <Card className="p-3 sm:p-6">
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                <table className="w-full text-xs sm:text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 font-semibold text-foreground">Feature</th>
                      {SUBSCRIPTION_TIERS.map((tier) => (
                        <th key={tier.id} className="text-center py-4 px-4 font-semibold text-foreground">
                          <div>
                            <div>{tier.displayName}</div>
                            <div className="text-xs text-muted-foreground font-normal">
                              ${tier.price}/mo
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Core Features */}
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-medium text-foreground">Emotion Tracking & Check-ins</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-medium text-foreground">Betting History & Performance Tracking</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-medium text-foreground">Emotional Wellness Score</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-medium text-foreground">Cooldown Mode & Safety Controls</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>

                    {/* Premium Features */}
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Basic Analytics Dashboard</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>

                    {/* Premium Plus Features */}
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Emotional Volatility Warnings</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Behavior-to-Performance Correlation</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>

                    {/* Apex Features */}
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Priority Support & Early Feature Access</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">TiltLab Emotional Analysis</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">1x/week</span></td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">3x/week</span></td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">7x/week</span></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">SmartSlip AI Picks</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">1x/week</span></td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">3x/week</span></td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">7x/week</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="p-8 bg-muted/50">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Ready to get started?
              </h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of users making smarter betting decisions with PlayMind Labs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href="/login">Get Started</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/faq">Learn More</a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </FooterPageWrapper>
  )
}
