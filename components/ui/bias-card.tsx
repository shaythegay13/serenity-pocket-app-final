"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface BiasCardProps {
  icon: LucideIcon
  title: string
  description: string
  severity?: "low" | "moderate" | "high"
  className?: string
}

export function BiasCard({ icon: Icon, title, description, severity = "moderate", className }: BiasCardProps) {
  const getSeverityStyles = () => {
    switch (severity) {
      case "high":
        return "border-red-500/50 bg-red-500/5"
      case "moderate":
        return "border-yellow-500/50 bg-yellow-500/5"
      case "low":
        return "border-blue-500/50 bg-blue-500/5"
      default:
        return "border-border bg-card"
    }
  }

  const getIconColor = () => {
    switch (severity) {
      case "high":
        return "text-red-500"
      case "moderate":
        return "text-yellow-500"
      case "low":
        return "text-blue-500"
      default:
        return "text-primary"
    }
  }

  return (
    <Card
      className={cn(
        "min-w-[280px] flex-shrink-0 border-2 transition-all hover:shadow-lg overflow-hidden",
        getSeverityStyles(),
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("shrink-0 p-2 rounded-lg bg-background/50", getIconColor())}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed break-words">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface BiasCarouselProps {
  children: React.ReactNode
  className?: string
}

export function BiasCarousel({ children, className }: BiasCarouselProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-3">
          {children}
        </div>
      </div>
      {/* Gradient fade indicators */}
      <div className="pointer-events-none absolute top-0 left-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute top-0 right-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}
