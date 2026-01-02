"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Brain, BarChart3, Zap, Shield, ArrowRight, Activity, Target, LineChart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface HomePageProps {
  onStart?: () => void;
  onLogin?: () => void;
}

export default function HomePage({ onStart, onLogin }: HomePageProps = {}) {
  return (
    <div className="min-h-screen bg-background">
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
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/analyze" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Analyze
            </Link>
            <Link href="/insights" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Insights
            </Link>
            <Link href="/performance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Performance
            </Link>
          </div>
          <Button size="sm" onClick={onLogin} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            Get Started
          </Button>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary border border-primary/20">
              <Sparkles className="h-4 w-4" />
              AI-Powered Sports Analytics
            </div>

            <h1 className="text-5xl font-bold leading-tight md:text-7xl text-balance">
              Win with <span className="gradient-text">Data & Discipline</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              Advanced behavioral analytics and AI-powered insights to transform your betting strategy. Make smarter
              decisions backed by psychology and predictive modeling.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={onStart} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/40 bg-card/20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Win Rate Improvement", value: "+23%" },
              { label: "Users Worldwide", value: "12K+" },
              { label: "Bets Analyzed", value: "2.4M+" },
              { label: "ROI Increase", value: "+18%" },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-1">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24">
        <div className="mb-16 text-center space-y-4">
          <h2 className="text-4xl font-bold md:text-5xl">Everything You Need to Win</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Professional-grade tools combining behavioral science with cutting-edge analytics
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Brain,
              title: "Behavioral Tracking",
              description:
                "Monitor emotional states and decision patterns to identify when psychology impacts your bets",
              color: "primary",
            },
            {
              icon: BarChart3,
              title: "Real-Time Analytics",
              description:
                "Live odds comparison, line movement tracking, and sharp money indicators across multiple sportsbooks",
              color: "secondary",
            },
            {
              icon: Zap,
              title: "AI-Powered Insights",
              description:
                "Machine learning models analyze thousands of data points to deliver personalized betting recommendations",
              color: "success",
            },
            {
              icon: Activity,
              title: "Performance Dashboard",
              description:
                "Comprehensive profit/loss tracking, ROI analysis, and detailed performance metrics over time",
              color: "warning",
            },
            {
              icon: Target,
              title: "Smart Bet Builder",
              description: "Construct optimal parlays and combos with AI-assisted selection and risk assessment",
              color: "primary",
            },
            {
              icon: LineChart,
              title: "Market Intelligence",
              description:
                "Public vs sharp money splits, consensus picks, and betting trend analysis for informed decisions",
              color: "secondary",
            },
          ].map((feature, i) => (
            <Card key={i} className="glass glass-hover group">
              <CardContent className="p-6 space-y-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${feature.color}/10`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary group-hover:translate-x-1 transition-transform"
                >
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-24">
        <Card className="glass overflow-hidden border-primary/20">
          <CardContent className="relative p-12 md:p-16">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="relative z-10 mx-auto max-w-3xl text-center space-y-6">
              <Shield className="mx-auto h-16 w-16 text-primary" />
              <h2 className="text-3xl font-bold md:text-4xl">Your Success is Built on Trust</h2>
              <p className="text-lg text-muted-foreground">
                All data is encrypted and optional. We prioritize responsible betting and give you full control over
                your information. Our mission is to help you win with discipline, not exploit impulsive decisions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" onClick={onStart} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  Start Your Journey
                </Button>
                <Button size="lg" variant="outline">
                  View Privacy Policy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border/40 bg-card/20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
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
              <p className="text-sm text-muted-foreground">
                Your behavioral betting companion for smarter, data-driven play.
              </p>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "Demo", "API"] },
              { title: "Resources", links: ["Blog", "Guides", "Support", "FAQ"] },
              { title: "Company", links: ["About", "Privacy", "Terms", "Contact"] },
            ].map((section, i) => (
              <div key={i} className="space-y-4">
                <h3 className="font-semibold">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            © 2025 Serenity Pocket. All rights reserved. Bet responsibly.
          </div>
        </div>
      </footer>
    </div>
  )
}
