"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { AccountTab } from "@/components/tabs/account-tab"
import { DashboardHeader } from "@/components/dashboard-header"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { UserData } from "@/lib/types"

// Transform database snake_case to camelCase for UserData
function transformProfileToUserData(profile: any): UserData {
  return {
    name: profile.name || '',
    username: profile.username,
    email: profile.email,
    level: profile.level || 1,
    xp: profile.xp || 0,
    xpToNextLevel: profile.xp_to_next_level || 100,
    emotionalAwarenessStreak: profile.emotional_awareness_streak || 0,
    biasRecognitionScore: profile.bias_recognition_score || 0,
    mindfulDecisionPercentage: profile.mindful_decision_percentage || 0,
    totalTrades: profile.total_trades || 0,
    mindfulTrades: profile.mindful_trades || 0,
    serenityTokens: profile.serenity_tokens || 0,
    dailyRings: profile.daily_rings || { emotionalAwareness: 0, biasRecognition: 0, mindfulness: 0 },
    lastRingReset: profile.last_ring_reset ? new Date(profile.last_ring_reset) : new Date(),
    perfectDays: profile.perfect_days || 0,
    longestStreak: profile.longest_streak || 0,
    totalEmotionsLogged: profile.total_emotions_logged || 0,
    totalBiasesIdentified: profile.total_biases_identified || 0,
    totalJournalsCompleted: profile.total_journals_completed || 0,
    totalModulesCompleted: profile.total_modules_completed || 0,
    totalBreathingExercises: profile.total_breathing_exercises || 0,
    mostProductiveDay: profile.most_productive_day || 0,
    surveyData: profile.survey_data,
    subscriptionTier: profile.subscription_tier || 'free',
    subscriptionStatus: profile.subscription_status,
    subscriptionStartedAt: profile.subscription_started_at,
    subscriptionEndsAt: profile.subscription_ends_at,
    age: profile.age,
    gender: profile.gender,
    location: profile.location,
    bettingExperience: profile.betting_experience,
    educationLevel: profile.education_level,
    incomeRange: profile.income_range,
    employmentStatus: profile.employment_status,
    maritalStatus: profile.marital_status,
    ethnicity: profile.ethnicity,
    bettingFrequency: profile.betting_frequency,
    typicalBetAmount: profile.typical_bet_amount,
    cooldownEnabled: profile.cooldown_enabled,
    behaviorNudgesEnabled: profile.behavior_nudges_enabled,
    dailyBetLimit: profile.daily_bet_limit,
    maxStakeLimit: profile.max_stake_limit,
  }
}

export default function AccountPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUserData(transformProfileToUserData(profile))
        }
      }
      setLoading(false)
    }

    fetchUserData()
  }, [])

  // Convert camelCase updates to snake_case for database
  const updateUserData = async (updates: Partial<UserData>) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Map camelCase to snake_case for database columns
      const dbUpdates: Record<string, any> = {}
      const keyMap: Record<string, string> = {
        subscriptionTier: 'subscription_tier',
        subscriptionStatus: 'subscription_status',
        subscriptionStartedAt: 'subscription_started_at',
        subscriptionEndsAt: 'subscription_ends_at',
        cooldownEnabled: 'cooldown_enabled',
        behaviorNudgesEnabled: 'behavior_nudges_enabled',
        dailyBetLimit: 'daily_bet_limit',
        maxStakeLimit: 'max_stake_limit',
        bettingExperience: 'betting_experience',
        educationLevel: 'education_level',
        incomeRange: 'income_range',
        employmentStatus: 'employment_status',
        maritalStatus: 'marital_status',
        bettingFrequency: 'betting_frequency',
        typicalBetAmount: 'typical_bet_amount',
      }

      for (const [key, value] of Object.entries(updates)) {
        const dbKey = keyMap[key] || key
        dbUpdates[dbKey] = value
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', session.user.id)

      if (!error) {
        setUserData((prev) => prev ? { ...prev, ...updates } : null)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {userData && <DashboardHeader userData={userData} />}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {userData && <AccountTab userData={userData} updateUserData={updateUserData} />}
            <Link
              href="/home"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
