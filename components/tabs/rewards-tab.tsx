"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Crown, Lock, Sparkles, Palette, BarChart3, Video, Users, Check, Trophy } from "lucide-react"
import type { UserData } from "@/lib/types"
import { TOKEN_MILESTONES } from "@/lib/gamification"
import { toast } from "sonner"

interface RewardsTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
}

interface UnlockedReward {
  id: string
  name: string
  unlockedAt: Date
}

export function RewardsTab({ userData, updateUserData }: RewardsTabProps) {
  const [showBadgeFrames, setShowBadgeFrames] = useState(false)
  const [showThemeColors, setShowThemeColors] = useState(false)
  
  const unlockedRewards = userData.unlockedRewards || []

  const rewards = [
    {
      id: "badge-frames",
      name: "Custom Badge Frames",
      description: "Personalize your achievement badges with exclusive frames and colors",
      cost: 100,
      icon: Sparkles,
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/50",
      available: true,
    },
    {
      id: "theme-colors",
      name: "Profile Theme Colors",
      description: "Customize your dashboard with premium color themes and gradients",
      cost: 500,
      icon: Palette,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/50",
      available: true,
    },
    {
      id: "analytics",
      name: "Advanced Analytics Dashboard",
      description: "Unlock deep insights into your emotional patterns and trading behavior",
      cost: 1000,
      icon: BarChart3,
      color: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/50",
      available: false,
      comingSoon: true,
    },
    {
      id: "masterclass",
      name: "Exclusive Masterclass Previews",
      description: "Early access to expert-led masterclasses on behavioral finance",
      cost: 2500,
      icon: Video,
      color: "from-orange-500/20 to-amber-500/20",
      borderColor: "border-orange-500/50",
      available: false,
      comingSoon: true,
    },
    {
      id: "coaching",
      name: "Personalized Coaching Session",
      description: "One-on-one session with a certified trading psychology coach",
      cost: 5000,
      icon: Users,
      color: "from-rose-500/20 to-red-500/20",
      borderColor: "border-rose-500/50",
      available: false,
      comingSoon: true,
    },
  ]

  const handleUnlock = async (reward: typeof rewards[0]) => {
    if (!reward.available) {
      toast.info("This reward will be available soon with premium subscriptions!")
      return
    }

    if (userData.serenityTokens < reward.cost) {
      toast.error(`Not enough tokens! You need ${reward.cost - userData.serenityTokens} more tokens.`)
      return
    }

    if (unlockedRewards.includes(reward.id)) {
      toast.info("You've already unlocked this reward!")
      return
    }

    // Deduct tokens and unlock reward
    await updateUserData({
      serenityTokens: userData.serenityTokens - reward.cost,
      unlockedRewards: [...unlockedRewards, reward.id]
    })

    toast.success(`🎉 ${reward.name} unlocked!`)
    
    // Open customization modal for badge frames or theme colors
    if (reward.id === 'badge-frames') {
      setShowBadgeFrames(true)
    } else if (reward.id === 'theme-colors') {
      setShowThemeColors(true)
    }
  }

  const canAfford = (cost: number) => userData.serenityTokens >= cost
  const isUnlocked = (rewardId: string) => unlockedRewards.includes(rewardId)

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Token Rewards</h2>
          <p className="text-muted-foreground">Redeem your Serenity Tokens for exclusive features</p>
        </div>
        <Card className="px-6 py-3 bg-linear-to-br from-primary/10 to-primary/5 border-primary/30">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{userData.serenityTokens}</p>
              <p className="text-xs text-muted-foreground">Serenity Tokens</p>
            </div>
          </div>
        </Card>
      </div>

      {/* How to Earn Tokens */}
      <Card className="p-6 bg-linear-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          How to Earn Tokens
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-background/50">
            <p className="text-2xl font-bold text-primary">+1</p>
            <p className="text-xs text-muted-foreground">Daily Emotion Check-in</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50">
            <p className="text-2xl font-bold text-primary">+3</p>
            <p className="text-xs text-muted-foreground">Journal Entry</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50">
            <p className="text-2xl font-bold text-primary">+5</p>
            <p className="text-xs text-muted-foreground">Identify Biases</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50">
            <p className="text-2xl font-bold text-primary">+10</p>
            <p className="text-xs text-muted-foreground">Complete Profile</p>
          </div>
        </div>
      </Card>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => {
          const Icon = reward.icon
          const unlocked = isUnlocked(reward.id)
          const affordable = canAfford(reward.cost)
          
          return (
            <Card
              key={reward.id}
              className={`p-6 relative overflow-hidden transition-all hover:shadow-lg ${
                unlocked ? "border-primary shadow-primary/20" : reward.borderColor
              }`}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-linear-to-br ${reward.color} opacity-50`} />
              
              {/* Content */}
              <div className="relative space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${reward.color} border ${reward.borderColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {reward.comingSoon && (
                    <Badge variant="outline" className="bg-amber-500/10 border-amber-500/50 text-amber-600">
                      Coming Soon
                    </Badge>
                  )}
                  {unlocked && (
                    <Badge className="bg-primary">
                      <Check className="h-3 w-3 mr-1" />
                      Unlocked
                    </Badge>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{reward.name}</h3>
                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                </div>

                {/* Cost & Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Crown className="h-4 w-4 text-primary" />
                      {reward.cost} tokens
                    </span>
                  </div>
                  {!unlocked && (
                    <>
                      <Progress 
                        value={Math.min((userData.serenityTokens / reward.cost) * 100, 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {Math.max(0, reward.cost - userData.serenityTokens)} tokens needed
                      </p>
                    </>
                  )}
                </div>

                {/* Unlock Button */}
                <Button
                  onClick={() => {
                    if (unlocked && (reward.id === 'badge-frames' || reward.id === 'theme-colors')) {
                      if (reward.id === 'badge-frames') setShowBadgeFrames(true)
                      if (reward.id === 'theme-colors') setShowThemeColors(true)
                    } else {
                      handleUnlock(reward)
                    }
                  }}
                  disabled={(!affordable && !unlocked) || !reward.available}
                  className="w-full"
                  variant={unlocked ? "outline" : "default"}
                >
                  {unlocked ? (
                    reward.id === 'badge-frames' || reward.id === 'theme-colors' ? (
                      <>
                        <Palette className="h-4 w-4 mr-2" />
                        Customize
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Unlocked
                      </>
                    )
                  ) : reward.comingSoon ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Premium Feature
                    </>
                  ) : affordable ? (
                    "Unlock Now"
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Not Enough Tokens
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Footer Note */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          💡 <strong>Pro Tip:</strong> Complete daily activities to earn more tokens. Premium features coming soon with subscription plans!
        </p>
      </Card>

      {/* Badge Frame Customization Modal */}
      <Dialog open={showBadgeFrames} onOpenChange={setShowBadgeFrames}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customize Badge Frames</DialogTitle>
            <DialogDescription>
              Choose a frame style for your achievement badges
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {[
              { id: 'default', name: 'Default', color: 'border-gray-400' },
              { id: 'gold', name: 'Gold', color: 'border-yellow-500' },
              { id: 'silver', name: 'Silver', color: 'border-gray-300' },
              { id: 'bronze', name: 'Bronze', color: 'border-orange-600' },
              { id: 'platinum', name: 'Platinum', color: 'border-blue-400' },
              { id: 'rainbow', name: 'Rainbow', color: 'border-purple-500' },
            ].map((frame) => (
              <button
                key={frame.id}
                onClick={async () => {
                  await updateUserData({ selectedBadgeFrame: frame.id })
                  toast.success(`Badge frame changed to ${frame.name}!`)
                }}
                className={`p-4 rounded-lg border-4 ${frame.color} ${
                  userData.selectedBadgeFrame === frame.id ? 'bg-primary/10 ring-2 ring-primary' : 'bg-card hover:bg-accent'
                } transition-all`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-16 h-16 rounded-full border-4 ${frame.color} flex items-center justify-center bg-background`}>
                    <Trophy className="h-8 w-8" />
                  </div>
                  <span className="font-semibold text-sm">{frame.name}</span>
                  {userData.selectedBadgeFrame === frame.id && (
                    <Badge variant="default" className="text-xs">Selected</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Theme Color Customization Modal */}
      <Dialog open={showThemeColors} onOpenChange={setShowThemeColors}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customize Profile Theme</DialogTitle>
            <DialogDescription>
              Choose a color theme for your dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {[
              { id: 'default', name: 'Default Blue', gradient: 'from-blue-500 to-cyan-500' },
              { id: 'purple', name: 'Purple Dream', gradient: 'from-purple-500 to-pink-500' },
              { id: 'green', name: 'Forest Green', gradient: 'from-green-500 to-emerald-500' },
              { id: 'orange', name: 'Sunset Orange', gradient: 'from-orange-500 to-red-500' },
              { id: 'teal', name: 'Ocean Teal', gradient: 'from-teal-500 to-blue-500' },
              { id: 'rose', name: 'Rose Gold', gradient: 'from-rose-500 to-amber-500' },
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={async () => {
                  await updateUserData({ selectedThemeColor: theme.id })
                  toast.success(`Theme changed to ${theme.name}!`)
                }}
                className={`p-4 rounded-lg border-2 ${
                  userData.selectedThemeColor === theme.id ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50'
                } transition-all`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-full h-20 rounded-lg bg-gradient-to-r ${theme.gradient}`} />
                  <span className="font-semibold text-sm">{theme.name}</span>
                  {userData.selectedThemeColor === theme.id && (
                    <Badge variant="default" className="text-xs">Selected</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
