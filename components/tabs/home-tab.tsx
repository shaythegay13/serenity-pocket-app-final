"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { UserData } from "@/lib/types"
import {
  Heart,
  Brain,
  ShoppingBag,
  BarChart3,
} from "lucide-react"

interface HomeTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  onNavigateToTab: (tab: string, subtab?: string) => void
  refreshKey: number
}

export function HomeTab({ userData, updateUserData, onNavigateToTab, refreshKey }: HomeTabProps) {
  const handleNavigate = (tab: string, subtab?: string) => {
    onNavigateToTab(tab, subtab)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-linear-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
          Welcome back, {userData.name}!
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Your emotional awareness companion for smarter, safer betting
        </p>
      </div>

      {/* 4 Large Action Buttons */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
        {/* Emotional Check-in Button */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 border-0 overflow-hidden rounded-3xl shadow-lg hover:shadow-xl"
          onClick={() => handleNavigate("behavior")}
        >
          <CardContent className="p-8 sm:p-10 space-y-6 text-center bg-linear-to-br from-blue-400 via-blue-500 to-cyan-400 hover:from-blue-500 hover:via-blue-600 hover:to-cyan-500 transition-all duration-300 rounded-3xl">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 mx-auto items-center justify-center rounded-full bg-white/25 backdrop-blur-sm shadow-lg">
              <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Emotional Check-in</h3>
              <p className="text-sm sm:text-base text-white/90">
                Log your emotions and identify patterns in your betting behavior
              </p>
            </div>
            <Button className="w-full bg-white/25 hover:bg-white/35 text-white border border-white/40 backdrop-blur-sm rounded-full font-medium">
              Start Check-in
            </Button>
          </CardContent>
        </Card>

        {/* Insights Button */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 border-0 overflow-hidden rounded-3xl shadow-lg hover:shadow-xl"
          onClick={() => window.location.href = '/insights'}
        >
          <CardContent className="p-8 sm:p-10 space-y-6 text-center bg-linear-to-br from-purple-400 via-purple-500 to-pink-400 hover:from-purple-500 hover:via-purple-600 hover:to-pink-500 transition-all duration-300 rounded-3xl">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 mx-auto items-center justify-center rounded-full bg-white/25 backdrop-blur-sm shadow-lg">
              <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Insights</h3>
              <p className="text-sm sm:text-base text-white/90">
                View your performance analytics and behavioral patterns
              </p>
            </div>
            <Button className="w-full bg-white/25 hover:bg-white/35 text-white border border-white/40 backdrop-blur-sm rounded-full font-medium">
              View Insights
            </Button>
          </CardContent>
        </Card>

        {/* Marketplace Button */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 border-0 overflow-hidden rounded-3xl shadow-lg hover:shadow-xl"
          onClick={() => window.location.href = '/insights/marketplace'}
        >
          <CardContent className="p-8 sm:p-10 space-y-6 text-center bg-linear-to-br from-green-400 via-green-500 to-emerald-400 hover:from-green-500 hover:via-green-600 hover:to-emerald-500 transition-all duration-300 rounded-3xl">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 mx-auto items-center justify-center rounded-full bg-white/25 backdrop-blur-sm shadow-lg">
              <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Marketplace</h3>
              <p className="text-sm sm:text-base text-white/90">
                Buy more AI credits and unlock premium features
              </p>
            </div>
            <Button className="w-full bg-white/25 hover:bg-white/35 text-white border border-white/40 backdrop-blur-sm rounded-full font-medium">
              Visit Marketplace
            </Button>
          </CardContent>
        </Card>

        {/* Correlation Insights Button */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 border-0 overflow-hidden rounded-3xl shadow-lg hover:shadow-xl"
          onClick={() => handleNavigate("analytics", "correlation")}
        >
          <CardContent className="p-8 sm:p-10 space-y-6 text-center bg-linear-to-br from-amber-400 via-amber-500 to-orange-400 hover:from-amber-500 hover:via-amber-600 hover:to-orange-500 transition-all duration-300 rounded-3xl">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 mx-auto items-center justify-center rounded-full bg-white/25 backdrop-blur-sm shadow-lg">
              <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Correlation Analysis</h3>
              <p className="text-sm sm:text-base text-white/90">
                Discover relationships between emotions and betting outcomes
              </p>
            </div>
            <Button className="w-full bg-white/25 hover:bg-white/35 text-white border border-white/40 backdrop-blur-sm rounded-full font-medium">
              View Correlations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
