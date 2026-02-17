"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Users, Zap, Crown, Sparkles, ArrowLeft } from "lucide-react"
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { supabase } from "@/lib/supabase"
import type { UserData } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"

const tierIcons = {
  free: Users,
  premium: Star,
  premium_plus: Zap,
  elite: Crown
}

const tierHighlights = {
  free: "Build your foundation with core behavioral tools",
  premium: "Sharpen your focus with real-time analytics",
  premium_plus: "Master the psychology of betting",
  elite: "The apex of AI-powered analysis"
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
    const { data: { session } } = await supabase.auth.getSession()

    // REDIRECT TO LOGIN IF NOT AUTHENTICATED
    // This prevents unauthenticated users from bypassing the login wall via the pricing page
    if (!session) {
      window.location.href = '/login'
      return
    }

    // For free plan, just redirect to home - users are automatically on free plan
    if (tierId === 'free') {
      window.location.href = '/home'
      return
    }

    // For paid plans, create checkout session
    const response = await fetch('/api/flowglad/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        tier: tierId
      }),
    })

    const data = await response.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      console.error('No checkout URL returned')
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
  }
}

export default function PricingPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        setAuthed(!!session)

        if (session) {
          try {
            const storedUserData = await storage.getUserData()
            if (isMounted) {
              setUserData(storedUserData)
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthed(false)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const handleNavigateToTab = (tab: string) => {
    router.push(`/${tab === 'odds' ? 'sports-dashboard' : tab}`)
  }

  const showGuarantee = (() => {
    if (!userData) return true
    const tierOrder = ["free", "premium", "premium_plus", "elite"]
    const userTierIndex = tierOrder.indexOf(userData.subscriptionTier || 'free')

    // Hide if beyond Focus plan
    if (userTierIndex > 1) return false

    // Hide if on Focus plan and past 7-day trial
    if (userData.subscriptionTier === 'premium' && userData.subscriptionStartedAt) {
      const trialDuration = 7 * 24 * 60 * 60 * 1000 // 7 days in ms
      const startTime = new Date(userData.subscriptionStartedAt).getTime()
      if (Date.now() - startTime > trialDuration) return false
    }

    return true
  })()

  const pricingContent = (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
            Choose the plan that fits your betting style and goals. All plans include our core responsible gaming features.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="text-sm">
              No hidden fees
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Cancel anytime
            </Badge>
            {showGuarantee && (
              <Badge variant="secondary" className="text-sm">
                7-day money-back guarantee
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {SUBSCRIPTION_TIERS.map((tier) => {
            const Icon = tierIcons[tier.id as keyof typeof tierIcons]
            const isPopular = tier.id === 'premium_plus'
            const isElite = tier.id === 'elite'
            const isCurrentTier = (userData?.subscriptionTier || 'free') === tier.id

            return (
              <Card
                key={tier.id}
                className={`relative p-6 transition-all duration-300 ${isCurrentTier ? 'ring-2 ring-primary border-primary shadow-xl scale-105 z-10' : ''
                  } ${isPopular && !isCurrentTier ? 'border-primary/50 shadow-md scale-102' : ''} ${isElite ? 'bg-linear-to-b from-primary/5 to-background' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentTier && (
                  <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-500">
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      Active
                    </Badge>
                  </div>
                )}

                {!isCurrentTier && isElite && (
                  <div className="absolute top-4 right-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-lg ${isElite || isCurrentTier ? 'bg-primary/20' : 'bg-muted'}`}>
                      <Icon className={`h-6 w-6 ${isElite || isCurrentTier ? 'text-primary' : 'text-muted-foreground'}`} />
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

                  <p className="text-xs text-muted-foreground italic mb-2">
                    {tierHighlights[tier.id as keyof typeof tierHighlights]}
                  </p>

                  {tier.id === 'premium' && (
                    <div className="mb-4">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        7-Day Free Trial
                      </Badge>
                    </div>
                  )}

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
                  variant={isCurrentTier ? 'outline' : (tier.id === 'free' ? 'outline' : isElite ? 'default' : isPopular ? 'default' : 'secondary')}
                  onClick={() => !isCurrentTier && handleSubscribe(tier.id)}
                  disabled={isCurrentTier}
                >
                  {isCurrentTier ? 'Current Plan' : (() => {
                    const tierOrder = ["free", "premium", "premium_plus", "elite"];
                    const userTierIndex = tierOrder.indexOf(userData?.subscriptionTier || 'free');
                    const currentTierIndex = tierOrder.indexOf(tier.id);

                    if (currentTierIndex < userTierIndex) {
                      return "Downgrade Now";
                    }
                    return tier.id === 'free' ? 'Get Started' : 'Upgrade Now';
                  })()}
                </Button>
              </Card>
            )
          })}
        </div>

        {/* Money Back Guarantee */}
        {showGuarantee && (
          <div className="text-center">
            <Card className="p-8 bg-muted/50">
              <div className="flex items-center justify-center mb-4">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  7-Day Money-Back Guarantee
                </Badge>
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Try PlayMind Labs Risk-Free
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                We're confident you'll love PlayMind Labs. If you're not completely satisfied within the first 7 days,
                we'll give you a full refund—no questions asked.
              </p>
              <Button size="lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Get Started Today
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  )

  // Always render content immediately for SEO crawlability.
  // Header/nav chrome loads in once auth resolves.
  return (
    <div className="min-h-screen bg-background">
      {!loading && authed && userData ? (
        <>
          <DashboardHeader userData={userData} onNavigateToTab={handleNavigateToTab} />
          <div className="hidden md:block">
            <Navigation />
          </div>
        </>
      ) : !loading ? (
        <div className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-3">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Main Page
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      <main className={!loading && authed && userData ? "pb-20 md:pb-0" : ""}>
        {pricingContent}
      </main>

      {!loading && authed && userData && <BottomNav />}
    </div>
  )
}
