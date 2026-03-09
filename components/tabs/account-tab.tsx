"use client"

import React, { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Crown, Lock, Loader2 } from "lucide-react"
import type { UserData } from "@/lib/types"
import { toast } from "sonner"

interface AccountTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
}

export const AccountTab = memo(function AccountTab({ userData, updateUserData }: AccountTabProps) {
  console.log('👤 AccountTab rendering with userData:', userData?.name, 'Tier:', userData?.subscriptionTier)

  const [upgrading, setUpgrading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Memoize local state to prevent unnecessary re-renders
  const localState = useMemo(() => ({
    name: userData.name,
    username: userData.username || '',
    age: userData.age?.toString() || '',
    location: userData.location || '',
    dailyLimit: userData.dailyBetLimit != null ? String(userData.dailyBetLimit) : '',
    maxStake: userData.maxStakeLimit != null ? String(userData.maxStakeLimit) : ''
  }), [userData.name, userData.username, userData.age, userData.location, userData.dailyBetLimit, userData.maxStakeLimit])

  const [localName, setLocalName] = useState(localState.name)
  const [localUsername, setLocalUsername] = useState(localState.username)
  const [localAge, setLocalAge] = useState(localState.age)
  const [localLocation, setLocalLocation] = useState(localState.location)
  const [localDailyLimit, setLocalDailyLimit] = useState(localState.dailyLimit)
  const [localMaxStake, setLocalMaxStake] = useState(localState.maxStake)

  // Memoize current tier
  const currentTier = useMemo(() => userData.subscriptionTier || "free", [userData.subscriptionTier])

  // Optimize useEffect with minimal dependencies
  useEffect(() => {
    setLocalName(localState.name)
    setLocalUsername(localState.username)
    setLocalAge(localState.age)
    setLocalLocation(localState.location)
    setLocalDailyLimit(localState.dailyLimit)
    setLocalMaxStake(localState.maxStake)
  }, [localState])

  // Log subscription data on mount/update
  console.log('💳 Current subscription:', {
    tier: userData.subscriptionTier,
    status: userData.subscriptionStatus,
    started: userData.subscriptionStartedAt,
    ends: userData.subscriptionEndsAt
  })

  const getApiBaseUrl = () => {
    if (typeof window === 'undefined') return ''

    // In Capacitor / mobile builds the origin may be file://, so relative fetch('/api/...') will fail.
    if (window.location.protocol === 'file:') {
      return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }

    return window.location.origin
  }

  const handleSyncSubscription = async () => {
    try {
      setSyncing(true)

      // Get auth session
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Not authenticated')
        return
      }

      const apiBaseUrl = getApiBaseUrl()

      // Call API to get fresh data (uses admin client)
      const response = await fetch(`${apiBaseUrl}/api/user/subscription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        let bodyText = ''
        try {
          bodyText = await response.text()
        } catch {
          // ignore
        }

        console.error('Subscription sync failed:', {
          status: response.status,
          statusText: response.statusText,
          body: bodyText,
        })

        throw new Error(bodyText || 'Failed to fetch subscription data')
      }

      const { profile } = await response.json()

      if (profile) {
        console.log('📊 Database subscription data:', {
          tier: profile.subscription_tier,
          status: profile.subscription_status,
          started: profile.subscription_started_at,
          ends: profile.subscription_ends_at,
        })

        // Update local state with fresh data from database
        await updateUserData({
          subscriptionTier: profile.subscription_tier || 'free',
          subscriptionStatus: profile.subscription_status,
          subscriptionStartedAt: profile.subscription_started_at,
          subscriptionEndsAt: profile.subscription_ends_at,
        })
        toast.success('Subscription synced successfully!')
      }
    } catch (error) {
      console.error('Error syncing subscription:', error)
      toast.error('Failed to sync subscription')
    } finally {
      setSyncing(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
      if (!confirmed) return

      const { supabase } = await import("@/lib/supabase")
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error("Not authenticated")
        return
      }

      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        toast.error(data?.error || "Failed to delete account")
        return
      }

      await supabase.auth.signOut()
      toast.success("Your account has been deleted")
      window.location.href = "/"
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Failed to delete account")
    }
  }

  // Check for success/cancel query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === 'true') {
        toast.success('Subscription successful! Your account has been upgraded.')
        // Clear the query params
        window.history.replaceState({}, '', window.location.pathname)
        // Sync subscription to refresh the data
        handleSyncSubscription()
      } else if (params.get('canceled') === 'true') {
        toast.info('Subscription canceled. You can upgrade anytime!')
        // Clear the query params
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const handleUpgrade = async (tierId: string) => {
    try {
      setUpgrading(true)

      // Get auth token
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Please sign in to upgrade')
        setUpgrading(false)
        return
      }

      // Create Flowglad checkout session
      const response = await fetch('/api/flowglad/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tier: tierId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Redirect to Flowglad checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error starting checkout:', error)
      toast.error('Failed to start checkout. Please try again.')
      setUpgrading(false)
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Account & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription and unlock more features
        </p>
      </div>

      {/* Current Subscription Status */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">Current Plan</h3>
            <p className="text-sm text-muted-foreground">
              {userData.subscriptionStatus === 'active'
                ? 'Your subscription is active'
                : 'Upgrade to unlock premium features'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {currentTier !== 'free' && (
              <Badge variant={userData.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                {userData.subscriptionStatus || 'inactive'}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncSubscription}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync'
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {currentTier === 'elite' ? (
              <Crown className="h-8 w-8 text-yellow-500" />
            ) : currentTier !== 'free' ? (
              <User className="h-8 w-8 text-primary" />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="font-semibold text-lg text-foreground">
                {currentTier === 'free' ? 'Foundation' :
                  currentTier === 'premium' ? 'Focus' :
                    currentTier === 'premium_plus' ? 'Mastery' : 'Apex'}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentTier === 'free' ? 'Basic behavioral tools' : 'Advanced analytical & psychological tools'}
              </p>
            </div>
          </div>

          {currentTier !== 'free' && (
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan Level:</span>
                <span className="font-medium text-foreground">
                  {currentTier === 'premium' ? 'Focus' :
                    currentTier === 'premium_plus' ? 'Mastery' : 'Apex'}
                </span>
              </div>
              {userData.subscriptionStartedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium text-foreground">
                    {new Date(userData.subscriptionStartedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {userData.subscriptionEndsAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {userData.subscriptionStatus === 'active' ? 'Renews:' : 'Ends:'}
                  </span>
                  <span className="font-medium text-foreground">
                    {new Date(userData.subscriptionEndsAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Safety & Responsible Use */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Safety & Responsible Use</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Cooldown Mode</p>
              <p className="text-xs text-muted-foreground">Temporarily limit features when volatility is detected</p>
            </div>
            <input
              type="checkbox"
              checked={!!userData.cooldownEnabled}
              onChange={(e) => updateUserData({ cooldownEnabled: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Behavior Nudges</p>
              <p className="text-xs text-muted-foreground">Enable risk explanations and gentle prompts</p>
            </div>
            <input
              type="checkbox"
              checked={!!userData.behaviorNudgesEnabled}
              onChange={(e) => updateUserData({ behaviorNudgesEnabled: e.target.checked })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Daily Bet Limit</label>
              <input
                type="number"
                min="0"
                value={localDailyLimit}
                onChange={(e) => setLocalDailyLimit(e.target.value)}
                onBlur={async () => {
                  const v = localDailyLimit === '' ? undefined : parseInt(localDailyLimit, 10)
                  await updateUserData({ dailyBetLimit: (Number.isNaN(v as any) ? undefined : v) as any })
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Number of bets per day"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Max Stake Limit ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={localMaxStake}
                onChange={(e) => setLocalMaxStake(e.target.value)}
                onBlur={async () => {
                  const v = localMaxStake === '' ? undefined : parseFloat(localMaxStake)
                  await updateUserData({ maxStakeLimit: (Number.isNaN(v as any) ? undefined : v) as any })
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Maximum stake per bet"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              If you no longer wish to use PlayMind Labs, you can permanently delete your account.
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Profile Settings */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Profile Settings</h3>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Display Name</label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={() => {
                if (localName !== userData.name) {
                  updateUserData({ name: localName })
                  toast.success('Name updated!')
                }
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your name"
            />
          </div>

          {/* Username */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Username</label>
            <input
              type="text"
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              onBlur={() => {
                if (localUsername !== (userData.username || '')) {
                  updateUserData({ username: localUsername })
                  toast.success('Username updated!')
                }
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Choose a username"
            />
          </div>

          {/* Demographics Section */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">Demographic Information (Optional)</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Help us improve PlayMind Labs by sharing some information about yourself.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Age</label>
                <input
                  type="number"
                  value={localAge}
                  onChange={(e) => setLocalAge(e.target.value)}
                  onBlur={() => {
                    const ageNum = localAge ? parseInt(localAge) : undefined
                    if (ageNum !== userData.age) {
                      updateUserData({ age: ageNum })
                      if (ageNum) toast.success('Age updated!')
                    }
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your age"
                  min="18"
                  max="120"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Gender</label>
                <select
                  value={userData.gender || ''}
                  onChange={(e) => {
                    updateUserData({ gender: e.target.value })
                    if (e.target.value) toast.success('Gender updated!')
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Location</label>
                <input
                  type="text"
                  value={localLocation}
                  onChange={(e) => setLocalLocation(e.target.value)}
                  onBlur={() => {
                    if (localLocation !== (userData.location || '')) {
                      updateUserData({ location: localLocation })
                      toast.success('Location updated!')
                    }
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="City, State/Country"
                />
              </div>

              {/* Betting Experience */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Betting Experience</label>
                <select
                  value={userData.bettingExperience || ''}
                  onChange={(e) => updateUserData({ bettingExperience: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  <option value="beginner">Beginner (Less than 1 year)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="experienced">Experienced (3-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
              </div>

              {/* Education Level */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Education Level</label>
                <select
                  value={userData.educationLevel || ''}
                  onChange={(e) => updateUserData({ educationLevel: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  <option value="high-school">High School or Less</option>
                  <option value="some-college">Some College</option>
                  <option value="associates">Associate's Degree</option>
                  <option value="bachelors">Bachelor's Degree</option>
                  <option value="masters">Master's Degree</option>
                  <option value="doctorate">Doctorate or Professional Degree</option>
                  <option value="prefer-not">Prefer not to say</option>
                </select>
              </div>

              {/* Income Range */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Annual Income Range</label>
                <select
                  value={userData.incomeRange || ''}
                  onChange={(e) => updateUserData({ incomeRange: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  <option value="under-25k">Under $25,000</option>
                  <option value="25k-50k">$25,000 - $50,000</option>
                  <option value="50k-75k">$50,000 - $75,000</option>
                  <option value="75k-100k">$75,000 - $100,000</option>
                  <option value="100k-150k">$100,000 - $150,000</option>
                  <option value="150k-200k">$150,000 - $200,000</option>
                  <option value="over-200k">Over $200,000</option>
                  <option value="prefer-not">Prefer not to say</option>
                </select>
              </div>

              {/* Employment Status */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Employment Status</label>
                <select
                  value={userData.employmentStatus || ''}
                  onChange={(e) => updateUserData({ employmentStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  <option value="employed-full">Employed Full-Time</option>
                  <option value="employed-part">Employed Part-Time</option>
                  <option value="self-employed">Self-Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                  <option value="unable">Unable to Work</option>
                  <option value="prefer-not">Prefer not to say</option>
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Marital Status</label>
                <select
                  value={userData.maritalStatus || ''}
                  onChange={(e) => updateUserData({ maritalStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="partnered">In a Relationship/Partnered</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                  <option value="prefer-not">Prefer not to say</option>
                </select>
              </div>

              {/* Ethnicity */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Ethnicity/Race</label>
                <select
                  value={userData.ethnicity || ''}
                  onChange={(e) => updateUserData({ ethnicity: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  <option value="white">White/Caucasian</option>
                  <option value="black">Black/African American</option>
                  <option value="hispanic">Hispanic/Latino</option>
                  <option value="asian">Asian</option>
                  <option value="native-american">Native American/Alaska Native</option>
                  <option value="pacific-islander">Pacific Islander</option>
                  <option value="middle-eastern">Middle Eastern/North African</option>
                  <option value="mixed">Two or More Races</option>
                  <option value="other">Other</option>
                  <option value="prefer-not">Prefer not to say</option>
                </select>
              </div>

              {/* Betting Frequency */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Betting Frequency</label>
                <select
                  value={userData.bettingFrequency || ''}
                  onChange={(e) => updateUserData({ bettingFrequency: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  <option value="daily">Daily</option>
                  <option value="several-times-week">Several times a week</option>
                  <option value="weekly">Weekly</option>
                  <option value="few-times-month">Few times a month</option>
                  <option value="monthly">Monthly</option>
                  <option value="occasionally">Occasionally</option>
                  <option value="rarely">Rarely</option>
                </select>
              </div>

              {/* Typical Bet Amount */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Typical Bet Amount</label>
                <select
                  value={userData.typicalBetAmount || ''}
                  onChange={(e) => updateUserData({ typicalBetAmount: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  <option value="under-10">Under $10</option>
                  <option value="10-25">$10 - $25</option>
                  <option value="25-50">$25 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-250">$100 - $250</option>
                  <option value="250-500">$250 - $500</option>
                  <option value="500-1000">$500 - $1,000</option>
                  <option value="over-1000">Over $1,000</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={async () => {
                  try {
                    // Save any pending local state changes
                    await updateUserData({
                      name: localName,
                      username: localUsername,
                      age: localAge ? parseInt(localAge) : undefined,
                      location: localLocation
                    })
                    toast.success('Profile data saved successfully! 🎉')
                  } catch (error) {
                    toast.error('Failed to save profile data')
                  }
                }}
                className="w-full"
              >
                Save Profile Data
              </Button>
            </div>
          </div>
        </div>
      </Card>

    </div>
  )
})
