"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, Target, Zap, Shield, BarChart3, Activity, LineChart, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function DashboardPage() {
  const [activeSport, setActiveSport] = useState("nfl")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 glass">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Serenity Pocket"
              width={72}
              height={72}
              className="h-18 w-18"
            />
            <span className="text-xl font-bold">Serenity Pocket</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="text-sm text-foreground font-medium">
              Dashboard
            </Link>
            <Link href="/analyze" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Analyze
            </Link>
            <Link href="/insights" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Insights
            </Link>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            Upgrade Pro
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl glass p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold md:text-5xl">Analytics Command Center</h1>
              <p className="text-muted-foreground text-lg">
                Real-time odds, AI-powered insights, and behavioral tracking
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 border border-success/20">
                <Radio className="h-4 w-4 text-success animate-pulse" />
                <span className="text-sm font-medium text-success">Live Markets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sport Selector */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {[
            { id: "nfl", name: "NFL", icon: "🏈" },
            { id: "nba", name: "NBA", icon: "🏀" },
            { id: "mlb", name: "MLB", icon: "⚾" },
            { id: "nhl", name: "NHL", icon: "🏒" },
            { id: "soccer", name: "Soccer", icon: "⚽" },
          ].map((sport) => (
            <button
              key={sport.id}
              onClick={() => setActiveSport(sport.id)}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                activeSport === sport.id
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                  : "glass glass-hover text-muted-foreground"
              }`}
            >
              <span className="text-lg">{sport.icon}</span>
              {sport.name}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Active Bets", value: "12", change: "+3", icon: Target, color: "primary" },
            { label: "Today's Edge", value: "94%", change: "+12%", icon: TrendingUp, color: "success" },
            { label: "Live Games", value: "8", change: "Now", icon: Radio, color: "destructive" },
            { label: "Streak", value: "5W", change: "Best: 12", icon: Zap, color: "warning" },
          ].map((stat, i) => (
            <Card key={i} className="glass">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <stat.icon className={`h-8 w-8 text-${stat.color}`} />
                  <Badge variant="outline" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Features Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Analysis Tools</h2>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Live Scores & Odds",
                description: "Real-time game tracking with live betting lines across all major sportsbooks",
                icon: Radio,
                badge: "LIVE",
                badgeVariant: "destructive" as const,
                href: "/dashboard/live-scores",
                gradient: "from-red-500/10 to-pink-500/10",
              },
              {
                title: "Odds Comparison",
                description: "Compare lines from 20+ sportsbooks to find the best value on every bet",
                icon: BarChart3,
                badge: "POPULAR",
                badgeVariant: "secondary" as const,
                href: "/dashboard/upcoming",
                gradient: "from-primary/10 to-secondary/10",
              },
              {
                title: "Team Analytics",
                description: "Deep dive into team stats, player props, matchup analysis, and injury reports",
                icon: Users,
                badge: null,
                badgeVariant: null,
                href: "/dashboard/analytics",
                gradient: "from-success/10 to-emerald-500/10",
              },
              {
                title: "Line Movement",
                description: "Track how lines move in real-time and identify sharp vs public money",
                icon: Activity,
                badge: null,
                badgeVariant: null,
                href: "/dashboard/line-movement",
                gradient: "from-primary/10 to-blue-500/10",
              },
              {
                title: "Betting Trends",
                description: "Public betting percentages, sharp action alerts, and consensus indicators",
                icon: TrendingUp,
                badge: "HOT",
                badgeVariant: "default" as const,
                href: "/dashboard/betting-trends",
                gradient: "from-warning/10 to-orange-500/10",
              },
              {
                title: "Weather Analysis",
                description: "Real-time weather data and historical impact analysis on totals and scoring",
                icon: Cloud,
                badge: null,
                badgeVariant: null,
                href: "/dashboard/weather",
                gradient: "from-secondary/10 to-purple-500/10",
              },
            ].map((feature, i) => (
              <Link key={i} href={feature.href}>
                <Card className="glass glass-hover group h-full relative overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                  <CardContent className="relative p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} backdrop-blur-sm`}
                      >
                        <feature.icon className="h-6 w-6" />
                      </div>
                      {feature.badge && (
                        <Badge variant={feature.badgeVariant} className="text-xs font-semibold">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                    <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                      Explore <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Assistant Section */}
        <Card className="glass border-primary/20">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
                  <LineChart className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-bold">AI Bet Analyzer</h3>
                <p className="text-muted-foreground">
                  Get instant analysis on any bet with our AI engine. Enter your bet details and receive comprehensive
                  insights including line movement, value assessment, and risk scoring.
                </p>
                <Link href="/analyze">
                  <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                    Analyze a Bet <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
