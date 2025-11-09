"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Crown, Lock, Sparkles, Palette, BarChart3, Video, Users, Check } from "lucide-react"
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
  // TODO: Store unlocked rewards in user data - for now using local state
  const [unlockedRewards, setUnlockedRewards] = useState<string[]>([])

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

  const handleUnlock = (reward: typeof rewards[0]) => {
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
    updateUserData({
      serenityTokens: userData.serenityTokens - reward.cost,
    })

    setUnlockedRewards([...unlockedRewards, reward.id])
    toast.success(`🎉 ${reward.name} unlocked!`)
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
                  onClick={() => handleUnlock(reward)}
                  disabled={!affordable || unlocked || !reward.available}
                  className="w-full"
                  variant={unlocked ? "outline" : "default"}
                >
                  {unlocked ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Unlocked
                    </>
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
    </div>
  )
}
