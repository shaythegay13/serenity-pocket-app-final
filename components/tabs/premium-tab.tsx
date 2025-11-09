"use client"

import { SubscriptionPricing } from "@/components/subscription-pricing"
import type { UserData } from "@/lib/types"

interface PremiumTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
}

export function PremiumTab({ userData, updateUserData }: PremiumTabProps) {
  return (
    <div className="space-y-6 fade-in">
      <SubscriptionPricing currentTier={userData.subscriptionTier || "free"} />
    </div>
  )
}
