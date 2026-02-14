"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  BarChart3,
  Trophy,
  Sparkles
} from "lucide-react"
import { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  variant?: "default" | "success" | "warning" | "danger"
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default"
}: KPICardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    danger: "border-destructive/30 bg-destructive/5"
  }

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-success" />
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />
    return null
  }

  return (
    <Card className={`p-6 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {trendValue && (
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon()}
                <span className={
                  trend === "up" ? "text-success" :
                  trend === "down" ? "text-destructive" :
                  "text-muted-foreground"
                }>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  )
}

interface KPICardsGridProps {
  totalBets: number
  winRate: number
  profit: number
  roi: number
  avgStake?: number
  avgEV?: number
  // Parlay metrics
  totalParlays?: number
  parlayWinRate?: number
  parlayROI?: number
  parlayPercentage?: number
}

export function KPICardsGrid({
  totalBets,
  winRate,
  profit,
  roi,
  avgStake,
  avgEV,
  totalParlays,
  parlayWinRate,
  parlayROI,
  parlayPercentage
}: KPICardsGridProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <KPICard
        title="Total Bets"
        value={totalBets}
        icon={BarChart3}
        subtitle="All time"
      />

      <KPICard
        title="Win Rate"
        value={formatPercentage(winRate)}
        icon={Target}
        trend={winRate >= 55 ? "up" : winRate <= 45 ? "down" : "neutral"}
        variant={winRate >= 55 ? "success" : winRate <= 45 ? "danger" : "default"}
      />

      <KPICard
        title="Total Profit"
        value={formatCurrency(profit)}
        icon={DollarSign}
        trend={profit > 0 ? "up" : profit < 0 ? "down" : "neutral"}
        trendValue={profit !== 0 ? formatCurrency(Math.abs(profit)) : undefined}
        variant={profit > 0 ? "success" : profit < 0 ? "danger" : "default"}
      />

      <KPICard
        title="ROI"
        value={formatPercentage(roi)}
        icon={Trophy}
        trend={roi > 0 ? "up" : roi < 0 ? "down" : "neutral"}
        variant={roi > 5 ? "success" : roi < -5 ? "danger" : "default"}
        subtitle="Return on investment"
      />

      {avgStake !== undefined && (
        <KPICard
          title="Avg Stake"
          value={formatCurrency(avgStake)}
          icon={Activity}
          subtitle="Per bet"
        />
      )}

      {avgEV !== undefined && (
        <KPICard
          title="Avg Expected Value"
          value={formatPercentage(avgEV)}
          icon={TrendingUp}
          trend={avgEV > 0 ? "up" : avgEV < 0 ? "down" : "neutral"}
          variant={avgEV > 3 ? "success" : avgEV < 0 ? "danger" : "default"}
          subtitle="Edge per bet"
        />
      )}

      {totalParlays !== undefined && totalParlays > 0 && (
        <>
          <KPICard
            title="Parlays"
            value={totalParlays}
            icon={Sparkles}
            subtitle={`${parlayPercentage?.toFixed(1) || 0}% of total bets`}
            variant="default"
          />

          {parlayWinRate !== undefined && (
            <KPICard
              title="Parlay Win Rate"
              value={formatPercentage(parlayWinRate)}
              icon={Target}
              trend={parlayWinRate >= 30 ? "up" : parlayWinRate <= 15 ? "down" : "neutral"}
              variant={parlayWinRate >= 30 ? "success" : parlayWinRate <= 15 ? "danger" : "default"}
              subtitle="Parlay success rate"
            />
          )}

          {parlayROI !== undefined && (
            <KPICard
              title="Parlay ROI"
              value={formatPercentage(parlayROI)}
              icon={Trophy}
              trend={parlayROI > 0 ? "up" : parlayROI < 0 ? "down" : "neutral"}
              variant={parlayROI > 0 ? "success" : parlayROI < 0 ? "danger" : "default"}
              subtitle="Parlay return on investment"
            />
          )}
        </>
      )}
    </div>
  )
}
