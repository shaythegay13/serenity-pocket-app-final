import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, TrendingUp, Brain, Shield, Target } from "lucide-react"
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers"
import { AuthenticatedLayout } from "@/components/authenticated-layout"

const featuredFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Get personalized betting insights powered by advanced machine learning algorithms that analyze your patterns and behavior.",
    tier: "premium"
  },
  {
    icon: TrendingUp,
    title: "Real-Time Odds Comparison",
    description: "Compare odds across all major sportsbooks in real-time to find the best value and maximize your potential returns.",
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
  }
]

export default function FeaturesPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Platform Features
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover the powerful tools and insights that make Serenity Pocket the most comprehensive 
              betting analytics platform available.
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
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">
              Compare All Features
            </h2>
            
            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
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
                      <td className="py-3 px-4 font-medium text-foreground">DSM-5 Based Assessment</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
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
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Live Odds Comparison</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Line Movement Charts & Timeline</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Analyze Your Bet (AI-powered)</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">SmartSlip AI Picks</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">1x/week</span></td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">3x/week</span></td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">7x/week</span></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">TiltLab Emotional Analysis</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">1x/week</span></td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">3x/week</span></td>
                      <td className="text-center py-3 px-2"><span className="text-xs text-muted-foreground">7x/week</span></td>
                    </tr>
                    
                    {/* Premium Plus Features */}
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Advanced Bias Detection & Analysis</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
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
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Enhanced Analytics with EV Tracking</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    
                    {/* Elite Features */}
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Emotionally-Aware AI Bet Recommendations</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">EV-Ranked Picks with Confidence Scores</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">Priority Support & Early Feature Access</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2">-</td>
                      <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
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
                Join thousands of users making smarter betting decisions with Serenity Pocket.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href="/pricing">View Pricing Plans</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/faq">Learn More</a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
