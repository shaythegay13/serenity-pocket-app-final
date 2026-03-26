"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Brain, BarChart3, Zap, TrendingUp, Target, Activity, Heart, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { PublicPageHeader } from "@/components/public/public-page-header"

interface LandingPageProps {
  onStart?: () => void
  onLogin: () => void
  onShowSignup?: (flow: string) => void
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [userStats, setUserStats] = useState<{
    totalUsers: number
    totalBets: number
    avgROI: number
    winRateImprovement: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [foundingSpotsLeft, setFoundingSpotsLeft] = useState<number | null>(null)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)

  const handleAcceptTerms = () => {
    setShowTermsModal(false)
    setAgreedToTerms(false)
    setAgreedToPrivacy(false)
    onLogin()
  }

  const handleDeclineTerms = () => {
    setShowTermsModal(false)
    setAgreedToTerms(false)
    setAgreedToPrivacy(false)
  }

  const canProceed = agreedToTerms && agreedToPrivacy

  useEffect(() => {
    const fetchUserStats = async () => {
      // Safety timeout to prevent permanent loading state
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn('Landing page stats fetch timed out');
          setLoading(false);
        }
      }, 5000);

      try {
        // Fetch total users count (for stats thresholds) and founding spots in parallel
        // Note: founding spots use a server-side API to bypass RLS for accurate elite count
        const [{ count: userCount }, foundingRes] = await Promise.all([
          supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
          fetch('/api/stats/founding-spots').then(r => r.ok ? r.json() : { spotsLeft: 100 }),
        ])
        const totalUsers = userCount || 0

        setFoundingSpotsLeft(foundingRes.spotsLeft ?? 100)

        // Fetch bet analyses for stats
        const { data: betAnalyses } = await supabase
          .from('bet_analyses')
          .select('outcome, stake, actual_return, timestamp')

        // Fetch emotion logs for behavioral analysis
        const { data: emotionLogs } = await supabase
          .from('emotion_logs')
          .select('timestamp, emotion')

        const totalBets = betAnalyses?.length || 0

        // Calculate average ROI
        const completedBets = betAnalyses?.filter(bet => bet.outcome !== 'pending' && bet.actual_return) || []
        const totalROI = completedBets.reduce((sum, bet) => {
          const roi = ((bet.actual_return || 0) - bet.stake) / bet.stake * 100
          return sum + roi
        }, 0)
        const avgROI = completedBets.length > 0 ? totalROI / completedBets.length : 0

        // Calculate win rate improvement (compare early vs recent performance)
        let winRateImprovement = 0
        if (betAnalyses && betAnalyses.length >= 100) {
          // Sort bets by date
          const sortedBets = betAnalyses
            .filter(bet => bet.outcome !== 'pending' && bet.timestamp)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

          if (sortedBets.length >= 50) {
            // Calculate early period win rate (first 25% of bets)
            const earlyPeriod = sortedBets.slice(0, Math.floor(sortedBets.length * 0.25))
            const earlyWins = earlyPeriod.filter(bet => bet.outcome === 'win').length
            const earlyWinRate = earlyWins / earlyPeriod.length

            // Calculate recent period win rate (last 25% of bets)
            const recentPeriod = sortedBets.slice(-Math.floor(sortedBets.length * 0.25))
            const recentWins = recentPeriod.filter(bet => bet.outcome === 'win').length
            const recentWinRate = recentWins / recentPeriod.length

            // Calculate improvement
            winRateImprovement = ((recentWinRate - earlyWinRate) * 100)

            // Cap improvement at reasonable range (-50% to +50%)
            winRateImprovement = Math.max(-50, Math.min(50, winRateImprovement))
          }
        }

        // Only show stats when we have substantial real data
        const meetsThresholds = totalUsers >= 50 && totalBets >= 100 && avgROI !== 0

        if (meetsThresholds) {
          // Use real stats when we have substantial data
          setUserStats({
            totalUsers,
            totalBets,
            avgROI,
            winRateImprovement
          })
        } else {
          // Don't show any stats until we have substantial real data
          setUserStats(null)
        }
      } catch (error) {
        console.error('Error fetching user stats:', error)
        // Don't show fake stats on error
        setUserStats(null)
      } finally {
        clearTimeout(timeoutId);
        setLoading(false)
      }
    }

    fetchUserStats()
  }, [])

  return (
    <div className="min-h-screen bg-linear-to-b from-[#0a0a1a] via-[#0f0f23] to-[#1a1a2e]">
      <PublicPageHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 pt-20 pb-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-white">Win with </span>
              <span className="bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Data
              </span>
              <br />
              <span className="bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                & Discipline
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-2">
              Advanced behavioral analytics and AI-powered insights to transform your betting strategy.
              Make smarter decisions backed by psychology and predictive modeling.
            </p>
          </div>
        </div>
      </section>

      {/* Founding Member Banner */}
      {foundingSpotsLeft !== null && foundingSpotsLeft > 0 && (
        <section className="py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-amber-900/30 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto">
              <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-8 text-center space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-4 py-1.5">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Founding Member Offer</span>
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Get Apex Access — Free, Forever
                </h2>

                <p className="text-gray-300 max-w-xl mx-auto leading-relaxed">
                  We&apos;re giving our first 100 members free lifetime access to our highest tier, <span className="text-amber-300 font-semibold">Apex</span>, in exchange for helping us validate our platform.
                  No credit card. No expiration. Just full access.
                </p>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <div className="flex items-center gap-2 rounded-lg bg-black/40 border border-amber-500/30 px-5 py-2.5">
                    <span className="text-2xl font-bold text-amber-400">{foundingSpotsLeft}</span>
                    <span className="text-sm text-gray-400">of 100 spots remaining</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    size="lg"
                    onClick={() => setShowTermsModal(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold px-8 rounded-xl shadow-lg shadow-amber-500/25"
                  >
                    Claim Your Free Spot
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Try Our Free Tools */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              <span className="text-white">Try Our </span>
              <span className="bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Free Tools
              </span>
            </h2>

            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-2">
              No account required. Experience the power of behavioral betting analytics right now.
            </p>

            <div className="grid md:grid-cols-2 gap-6 pt-8 max-w-3xl mx-auto">
              <Link href="/check-in" className="group">
                <Card className="h-full bg-gray-900/80 border-gray-700 hover:border-blue-500/50 transition-all duration-300 p-6 text-left">
                  <div className="inline-flex p-3 rounded-xl bg-blue-500/10 mb-4">
                    <Heart className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Emotional Check-In</h3>
                  <p className="text-sm text-gray-400 mb-4">Track how you feel before, during, and after betting. Recognize when tilt or FOMO might be driving your decisions.</p>
                  <span className="text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                    How are you feeling? &rarr;
                  </span>
                </Card>
              </Link>

              <Link href="/serenity" className="group">
                <Card className="h-full bg-gray-900/80 border-gray-700 hover:border-purple-500/50 transition-all duration-300 p-6 text-left">
                  <div className="inline-flex p-3 rounded-xl bg-purple-500/10 mb-4">
                    <Brain className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Serenity Survey</h3>
                  <p className="text-sm text-gray-400 mb-4">Discover your betting archetype and risk profile with our 12-question assessment. Get personalized insights into your strengths and blind spots.</p>
                  <span className="text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                    Take the survey &rarr;
                  </span>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-800/50 bg-black/20">
        <div className="container mx-auto px-4">
          {loading ? (
            // Show skeleton loading while fetching stats
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="text-center space-y-2">
                  <div className="h-12 w-24 mx-auto bg-gray-700/50 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-20 mx-auto bg-gray-700/50 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : userStats ? (
            // Show stats (real data when substantial, otherwise marketing stats)
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-green-400">
                  +{userStats.winRateImprovement.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Win Rate Improvement</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-blue-400">
                  {userStats.totalUsers >= 1000
                    ? `${(userStats.totalUsers / 1000).toFixed(1)}K+`
                    : `${userStats.totalUsers}+`
                  }
                </div>
                <div className="text-sm text-gray-400">Users Worldwide</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-purple-400">
                  {userStats.totalBets >= 1000000
                    ? `${(userStats.totalBets / 1000000).toFixed(1)}M+`
                    : userStats.totalBets >= 1000
                      ? `${(userStats.totalBets / 1000).toFixed(1)}K+`
                      : `${userStats.totalBets}+`
                  }
                </div>
                <div className="text-sm text-gray-400">Bets Analyzed</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-pink-400">
                  +{userStats.avgROI.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">ROI Increase</div>
              </div>
            </div>
          ) : null // Don't show stats section until we have substantial real data
          }
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Win
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Professional-grade tools combining behavioral science with cutting-edge analytics
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Brain,
                title: "Behavioral Tracking",
                description: "Monitor emotional states and decision patterns to identify when psychology impacts your bets",
                color: "from-blue-500 to-cyan-500",
                iconColor: "text-blue-400"
              },
              {
                icon: BarChart3,
                title: "Real-Time Analytics",
                description: "Advanced analytics and insights for informed decision-making",
                color: "from-purple-500 to-pink-500",
                iconColor: "text-purple-400"
              },
              {
                icon: Zap,
                title: "AI-Powered Insights",
                description: "Machine learning models analyze thousands of data points to deliver personalized betting recommendations",
                color: "from-green-500 to-emerald-500",
                iconColor: "text-green-400"
              },
              {
                icon: TrendingUp,
                title: "Performance Analytics",
                description: "Comprehensive profit/loss tracking, ROI analysis, and detailed performance metrics over time",
                color: "from-orange-500 to-red-500",
                iconColor: "text-orange-400"
              },
              {
                icon: Target,
                title: "Parlay Optimizer",
                description: "Construct optimal parlays and combos with AI-assisted selection and risk assessment",
                color: "from-indigo-500 to-purple-500",
                iconColor: "text-indigo-400"
              },
              {
                icon: Activity,
                title: "Data Analytics",
                description: "Comprehensive data analysis and trend insights for better decision-making",
                color: "from-pink-500 to-rose-500",
                iconColor: "text-pink-400"
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="group relative overflow-hidden bg-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-300 p-6 min-h-[200px] flex flex-col"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                <div className="relative space-y-4 flex-1 flex flex-col">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-linear-to-br ${feature.color} bg-opacity-20`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-linear-to-br from-blue-950/20 to-purple-950/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Shield Icon */}
            <div className="inline-flex p-6 rounded-full bg-blue-500/10 border-2 border-blue-500/20">
              <Shield className="h-16 w-16 text-blue-400" />
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Your Success is Built on Trust
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
              All data is encrypted and optional. We prioritize responsible betting and give you full control
              over your information. Our mission is to help you win with discipline, not exploit impulsive decisions.
            </p>

            {/* CTA Button */}
            <div className="flex items-center justify-center pt-4">
              <Button
                size="lg"
                onClick={() => setShowTermsModal(true)}
                className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 rounded-xl"
              >
                Create Free Account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Terms Agreement Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-border">
          {/* Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="PlayMind Labs" width={60} height={60} className="logo-dark-mode" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">Terms & Agreements</DialogTitle>
            <p className="text-muted-foreground">
              Please review and accept our terms to continue
            </p>
          </div>

          {/* Terms of Service */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Terms of Service</h2>
            <ScrollArea className="h-48 rounded-md border border-border p-4">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Welcome to PlayMind Labs</p>

                <p>
                  By accessing and using PlayMind Labs, you agree to be bound by these Terms of Service.
                  Please read them carefully.
                </p>

                <p className="font-semibold text-foreground">1. Service Description</p>
                <p>
                  PlayMind Labs is a psychological support and decision-making tool designed to help sports
                  bettors and day traders manage emotions, identify cognitive biases, and develop disciplined
                  trading and betting habits.
                </p>

                <p className="font-semibold text-foreground">2. Not Financial Advice</p>
                <p>
                  PlayMind Labs does NOT provide financial, investment, or betting advice. All insights and
                  tools are for educational and self-awareness purposes only. You are solely responsible for
                  your financial decisions. Past performance does not guarantee future results.
                </p>

                <p className="font-semibold text-foreground">3. Risk Acknowledgment</p>
                <p>
                  Trading and betting involve substantial risk of loss. You acknowledge that you may lose some
                  or all of your invested capital. Never invest or bet more than you can afford to lose.
                </p>

                <p className="font-semibold text-foreground">4. User Responsibilities</p>
                <p>
                  You agree to: (a) provide accurate information, (b) maintain the confidentiality of your
                  account, (c) use the service for lawful purposes only, and (d) comply with all applicable
                  laws and regulations regarding trading and betting in your jurisdiction.
                </p>

                <p className="font-semibold text-foreground">5. Subscription and Billing</p>
                <p>
                  PlayMind Labs offers a free tier and paid subscription tiers. Paid subscriptions will be
                  billed on a recurring basis until cancelled. All fees are non-refundable except as required
                  by law.
                </p>

                <p className="font-semibold text-foreground">6. Intellectual Property</p>
                <p>
                  All content, features, and functionality of PlayMind Labs are owned by us and protected
                  by copyright, trademark, and other intellectual property laws.
                </p>

                <p className="font-semibold text-foreground">7. Limitation of Liability</p>
                <p>
                  To the maximum extent permitted by law, PlayMind Labs and its operators shall not be
                  liable for any financial losses, trading losses, betting losses, or any indirect,
                  incidental, or consequential damages arising from your use of the service.
                </p>

                <p className="font-semibold text-foreground">8. Service Modifications</p>
                <p>
                  We reserve the right to modify, suspend, or discontinue any part of the service at any
                  time without notice.
                </p>

                <p className="font-semibold text-foreground">9. Termination</p>
                <p>
                  We may terminate or suspend your access to the service immediately, without prior notice,
                  for conduct that we believe violates these Terms or is harmful to other users.
                </p>

                <p className="font-semibold text-foreground">10. Changes to Terms</p>
                <p>
                  We may update these Terms from time to time. Continued use of the service after changes
                  constitutes acceptance of the new Terms.
                </p>
              </div>
            </ScrollArea>
          </div>

          {/* Privacy Policy */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Privacy Policy</h2>
            <ScrollArea className="h-48 rounded-md border border-border p-4">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Your Privacy Matters</p>

                <p>
                  This Privacy Policy explains how we collect, use, and protect your personal information.
                </p>

                <p className="font-semibold text-foreground">1. Information We Collect</p>
                <p>
                  We collect: (a) Account information (name, email, username), (b) Survey responses about
                  your trading/betting habits, (c) Usage data (emotions logged, biases identified, journal
                  entries), (d) Technical data (IP address, browser type, device information).
                </p>

                <p className="font-semibold text-foreground">2. How We Use Your Information</p>
                <p>
                  We use your information to: (a) Provide and improve our service, (b) Personalize your
                  experience, (c) Send important updates and notifications, (d) Analyze usage patterns and
                  trends, (e) Ensure security and prevent fraud.
                </p>

                <p className="font-semibold text-foreground">3. Data Storage and Security</p>
                <p>
                  Your data is stored securely using industry-standard encryption. We use Supabase for
                  authentication and data storage. While we implement robust security measures, no system
                  is completely secure.
                </p>

                <p className="font-semibold text-foreground">4. Data Sharing</p>
                <p>
                  We do NOT sell your personal information. We may share data with: (a) Service providers
                  who assist in operating our platform, (b) Law enforcement when required by law,
                  (c) Aggregate, anonymized data for research purposes.
                </p>

                <p className="font-semibold text-foreground">5. Cookies and Tracking</p>
                <p>
                  We use cookies and similar technologies to maintain your session, remember preferences,
                  and analyze usage. You can control cookies through your browser settings.
                </p>

                <p className="font-semibold text-foreground">6. Your Rights</p>
                <p>
                  You have the right to: (a) Access your personal data, (b) Correct inaccurate data,
                  (c) Request deletion of your data, (d) Export your data, (e) Opt out of marketing
                  communications.
                </p>

                <p className="font-semibold text-foreground">7. Data Retention</p>
                <p>
                  We retain your data for as long as your account is active or as needed to provide services.
                  If you delete your account, we will delete your personal data within 30 days, except where
                  retention is required by law.
                </p>

                <p className="font-semibold text-foreground">8. Children's Privacy</p>
                <p>
                  PlayMind Labs is not intended for users under 18. We do not knowingly collect information
                  from children.
                </p>

                <p className="font-semibold text-foreground">9. International Users</p>
                <p>
                  Your information may be transferred to and processed in countries other than your own.
                  By using our service, you consent to such transfers.
                </p>

                <p className="font-semibold text-foreground">10. Contact Us</p>
                <p>
                  For privacy concerns or data requests, contact us at info@playmindlabs.com
                </p>
              </div>
            </ScrollArea>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-muted/30">
              <Checkbox
                id="terms-modal"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="size-5 border-2 border-muted-foreground/50 data-[state=checked]:border-primary mt-0.5"
              />
              <label htmlFor="terms-modal" className="text-sm cursor-pointer leading-relaxed">
                I have read and agree to the <span className="font-semibold">Terms of Service</span>.
                I understand that trading and betting involve substantial risk of loss and that PlayMind Labs
                does not provide financial advice.
              </label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-muted/30">
              <Checkbox
                id="privacy-modal"
                checked={agreedToPrivacy}
                onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
                className="size-5 border-2 border-muted-foreground/50 data-[state=checked]:border-primary mt-0.5"
              />
              <label htmlFor="privacy-modal" className="text-sm cursor-pointer leading-relaxed">
                I have read and agree to the <span className="font-semibold">Privacy Policy</span>.
                I consent to the collection and use of my information as described.
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleDeclineTerms} className="flex-1">
              Decline
            </Button>
            <Button
              onClick={handleAcceptTerms}
              disabled={!canProceed}
              className="flex-1"
            >
              Accept & Continue
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pb-2">
            By continuing, you acknowledge that you have read, understood, and agree to be bound by
            these terms and policies
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
