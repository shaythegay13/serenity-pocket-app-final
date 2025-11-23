"use client"

import { EmotionsTab } from "./emotions-tab"
import type { UserData } from "@/lib/types"

interface BehaviorTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  refreshKey?: number
}

// Behavior tab is essentially the emotions tracking tab
// This maintains backward compatibility while using new naming
export function BehaviorTab({ userData, updateUserData, refreshKey }: BehaviorTabProps) {
  return <EmotionsTab userData={userData} updateUserData={updateUserData} refreshKey={refreshKey} />
}
