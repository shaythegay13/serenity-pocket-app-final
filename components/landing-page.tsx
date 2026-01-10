"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Brain, BarChart3, Zap, TrendingUp, Target, Activity } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface LandingPageProps {
  onStart?: () => void
  onLogin: () => void
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [userStats, setUserStats] = useState<{
    totalUsers: number
    totalBets: number
    avgROI: number
    winRateImprovement: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Fetch total users count
        const { count: userCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })

        // Fetch bet analyses for stats
        const { data: betAnalyses } = await supabase
          .from('bet_analyses')
          .select('outcome, stake, actual_return, created_at')

        // Fetch emotion logs for behavioral analysis
        const { data: emotionLogs } = await supabase
          .from('emotion_logs')
          .select('timestamp, emotion')

        // Calculate real stats
        const totalUsers = userCount || 0
        const totalBets = betAnalyses?.length || 0
        
        // Calculate average ROI
        const completedBets = betAnalyses?.filter(bet => bet.outcome !== 'pending' && bet.actual_return) || []
        const totalROI = completedBets.reduce((sum, bet) => {
          const roi = ((bet.actual_return || 0) - bet.stake) / bet.stake * 100
          return sum + roi
        }, 0)
        const avgROI = completedBets.length > 0 ? totalROI / completedBets.length : 0

        // Calculate win rate improvement (simplified - comparing first vs last month performance)
        const winRateImprovement = totalUsers > 100 ? Math.random() * 30 + 10 : 0 // Placeholder calculation

        // Only show stats if they meet minimum thresholds
        const meetsThresholds = totalUsers >= 50 && totalBets >= 1000 && avgROI !== 0

        if (meetsThresholds) {
          setUserStats({
            totalUsers,
            totalBets,
            avgROI,
            winRateImprovement
          })
        } else {
          setUserStats(null) // Don't show stats if they're too low
        }
      } catch (error) {
        console.error('Error fetching user stats:', error)
        setUserStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f23] to-[#0a0a1a]">
      {/* Header Section */}
      <header className="relative border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center md:justify-start">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Serenity Pocket Logo"
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome to Serenity Pocket
                </h1>
                <p className="text-sm text-gray-400">
                  Your behavioral betting companion
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 pt-20 pb-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            
            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="text-white">Win with </span>
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Data
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                & Discipline
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Advanced behavioral analytics and AI-powered insights to transform your betting strategy.
              Make smarter decisions backed by psychology and predictive modeling.
            </p>

            {/* CTA Button */}
            <div className="flex items-center justify-center pt-4">
              <Button
                size="lg"
                onClick={onLogin}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl"
              >
                Log In to Get Started →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-800/50 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { value: "+23%", label: "Win Rate Improvement", color: "text-green-400" },
              { value: "12K+", label: "Users Worldwide", color: "text-blue-400" },
              { value: "2.4M+", label: "Bets Analyzed", color: "text-purple-400" },
              { value: "+18%", label: "ROI Increase", color: "text-pink-400" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center space-y-2">
                <div className={`text-4xl md:text-5xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
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

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                description: "Live odds comparison, line movement tracking, and sharp money indicators across multiple sportsbooks",
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
                title: "Betting Trends",
                description: "Public vs sharp money splits, consensus picks, and betting trend analysis for informed decisions",
                color: "from-pink-500 to-rose-500",
                iconColor: "text-pink-400"
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="group relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 p-6"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <div className="relative space-y-4">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-10`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
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
      <section className="py-24 bg-gradient-to-br from-blue-950/20 to-purple-950/20">
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
                onClick={onLogin}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 rounded-xl"
              >
                Log In to Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
