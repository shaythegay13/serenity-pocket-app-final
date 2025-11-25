"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Crown, Check, Lock, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserData } from "@/lib/types"
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers"
import { toast } from "sonner"

interface AccountTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
}

export function AccountTab({ userData, updateUserData }: AccountTabProps) {
  const [upgrading, setUpgrading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [localName, setLocalName] = useState(userData.name)
  const [localUsername, setLocalUsername] = useState(userData.username || '')
  const [localAge, setLocalAge] = useState(userData.age?.toString() || '')
  const [localLocation, setLocalLocation] = useState(userData.location || '')
  const [localDailyLimit, setLocalDailyLimit] = useState<string>(
    userData.dailyBetLimit != null ? String(userData.dailyBetLimit) : ''
  )
  const [localMaxStake, setLocalMaxStake] = useState<string>(
    userData.maxStakeLimit != null ? String(userData.maxStakeLimit) : ''
  )
  const currentTier = userData.subscriptionTier || "free"
  const currentTierData = SUBSCRIPTION_TIERS.find((t) => t.id === currentTier)
  const isDev = process.env.NODE_ENV === 'development'

  // Update local state when userData changes
  useEffect(() => {
    setLocalName(userData.name)
    setLocalUsername(userData.username || '')
    setLocalAge(userData.age?.toString() || '')
    setLocalLocation(userData.location || '')
    setLocalDailyLimit(userData.dailyBetLimit != null ? String(userData.dailyBetLimit) : '')
    setLocalMaxStake(userData.maxStakeLimit != null ? String(userData.maxStakeLimit) : '')
  }, [userData.name, userData.username, userData.age, userData.location])

  // Log subscription data on mount/update
  console.log('💳 Current subscription:', {
    tier: userData.subscriptionTier,
    status: userData.subscriptionStatus,
    started: userData.subscriptionStartedAt,
    ends: userData.subscriptionEndsAt
  })

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

      // Call API to get fresh data (uses admin client)
      const response = await fetch('/api/user/subscription', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data')
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

  // TEMPORARY: Manual subscription test
  const handleTestSubscription = async (tier: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Not authenticated')
        return
      }

      console.log('🧪 Testing subscription update to:', tier)
      
      const response = await fetch('/api/test-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tier }),
      })

      const data = await response.json()
      console.log('🧪 Test subscription response:', data)

      if (!response.ok) {
        console.error('❌ Test subscription failed:', data)
        throw new Error(data.error || 'Failed to update subscription')
      }

      toast.success(`Test subscription updated to ${tier}!`)
      
      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 500))
      await handleSyncSubscription()
    } catch (error) {
      console.error('❌ Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update test subscription')
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
      
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
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
      
      // Redirect to Stripe checkout
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
                {currentTierData?.displayName || 'Free Plan'}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentTierData?.description || 'Basic features'}
              </p>
            </div>
          </div>

          {currentTier !== 'free' && (
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium text-foreground">
                  ${currentTierData?.price}/month
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
              
              {/* Downgrade Options */}
              <div className="pt-2 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Change Plan:</p>
                <div className="flex flex-col gap-2">
                  {/* Show downgrade options for lower tiers */}
                  {SUBSCRIPTION_TIERS.filter(tier => {
                    const tierOrder = { free: 0, premium: 1, premium_plus: 2, elite: 3 }
                    return tierOrder[tier.id as keyof typeof tierOrder] < tierOrder[currentTier as keyof typeof tierOrder]
                  }).map((tier) => (
                    <Button
                      key={tier.id}
                      size="sm"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={async () => {
                        const action = tier.id === 'free' ? 'cancel' : 'downgrade'
                        const message = tier.id === 'free' 
                          ? 'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.'
                          : `Downgrade to ${tier.displayName} ($${tier.price}/month)? This will take effect at the end of your current billing period.`
                        
                        if (confirm(message)) {
                          try {
                            const { supabase } = await import('@/lib/supabase')
                            const { data: { session } } = await supabase.auth.getSession()
                            if (!session) return
                            
                            const res = await fetch('/api/test-subscription', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                              },
                              body: JSON.stringify({ tier: tier.id })
                            })
                            
                            const result = await res.json()
                            
                            if (res.ok && result.success) {
                              const successMessage = tier.id === 'free'
                                ? 'Subscription canceled. You will retain access until the end of your billing period.'
                                : `Plan changed to ${tier.displayName}. Changes will take effect at the end of your billing period.`
                              toast.success(successMessage)
                              
                              // Wait a moment for database to commit
                              await new Promise(resolve => setTimeout(resolve, 500))
                              await handleSyncSubscription()
                            } else {
                              const errorMsg = result.error || `Failed to ${action} subscription`
                              console.error('Subscription change error:', errorMsg)
                              toast.error(errorMsg)
                            }
                          } catch (e) {
                            console.error('Subscription change exception:', e)
                            toast.error(`Failed to ${action} subscription: ${e instanceof Error ? e.message : 'Unknown error'}`)
                          }
                        }
                      }}
                    >
                      <span>{tier.id === 'free' ? 'Cancel Subscription' : `Downgrade to ${tier.displayName}`}</span>
                      {tier.id !== 'free' && <span className="text-xs">${tier.price}/mo</span>}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Dev Mode: Tier Switcher */}
      {isDev && (
        <>
          <Card className="p-4 bg-yellow-500/10 border-yellow-500/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🛠️</span>
              <h3 className="text-sm font-semibold text-foreground">Developer Mode: Test Subscription Tiers</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Instantly switch between tiers to test premium features. This only appears in development.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUBSCRIPTION_TIERS.map((tier) => (
                <Button
                  key={tier.id}
                  size="sm"
                  variant={currentTier === tier.id ? "default" : "outline"}
                  onClick={() => updateUserData({ subscriptionTier: tier.id as any })}
                  className="flex items-center gap-2"
                >
                  {tier.id === "elite" && <Crown className="h-3 w-3" />}
                  {tier.displayName}
                  {currentTier === tier.id && <Check className="h-3 w-3" />}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-blue-500/10 border-blue-500/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🧪</span>
              <h3 className="text-sm font-semibold text-foreground">Test Database Subscription Update</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Manually update subscription in database (bypasses Stripe webhook for testing).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={async () => {
                  try {
                    const { supabase } = await import('@/lib/supabase')
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session) return
                    
                    const res = await fetch('/api/create-profile', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${session.access_token}` }
                    })
                    const data = await res.json()
                    if (res.ok) {
                      toast.success('Profile created!')
                      await handleSyncSubscription()
                    } else {
                      toast.error(data.error)
                    }
                  } catch (e) {
                    toast.error('Failed to create profile')
                  }
                }}
              >
                🔨 Create Profile
              </Button>
              {SUBSCRIPTION_TIERS.filter(t => t.id !== 'free').map((tier) => (
                <Button
                  key={tier.id}
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestSubscription(tier.id)}
                >
                  Set {tier.displayName}
                </Button>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Current Plan */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              {currentTier === "free" ? (
                <User className="h-8 w-8 text-primary" />
              ) : (
                <Crown className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">{currentTierData?.displayName}</h3>
              <p className="text-sm text-muted-foreground">{currentTierData?.name}</p>
            </div>
          </div>
          {currentTier !== "free" && (
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">${currentTierData?.price}</p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
          )}
        </div>
      </Card>

      {/* Subscription Tiers */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Available Plans</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SUBSCRIPTION_TIERS.map((tier) => {
            const isCurrentTier = tier.id === currentTier
            const isUpgrade = SUBSCRIPTION_TIERS.findIndex((t) => t.id === tier.id) > 
                             SUBSCRIPTION_TIERS.findIndex((t) => t.id === currentTier)

            return (
              <Card
                key={tier.id}
                className={`p-6 ${
                  isCurrentTier
                    ? "border-primary/50 bg-primary/5"
                    : "hover:shadow-lg transition-shadow"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-foreground">{tier.displayName}</h4>
                    <p className="text-sm text-muted-foreground">{tier.name}</p>
                  </div>
                  {isCurrentTier && (
                    <Badge variant="default">Current Plan</Badge>
                  )}
                </div>

                <div className="mb-4">
                  {tier.price === 0 ? (
                    <p className="text-3xl font-bold text-foreground">Free</p>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">${tier.price}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
                </div>

                <div className="space-y-2 mb-6">
                  {tier.features.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                  {tier.features.length > 5 && (
                    <p className="text-xs text-muted-foreground pl-6">
                      +{tier.features.length - 5} more features
                    </p>
                  )}
                </div>

                {isCurrentTier ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : isUpgrade ? (
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={upgrading}
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Upgrade to {tier.displayName}</>
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={async () => {
                      const message = tier.id === 'free' 
                        ? 'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.'
                        : `Downgrade to ${tier.displayName} ($${tier.price}/month)? This will take effect at the end of your current billing period.`
                      
                      if (confirm(message)) {
                        try {
                          const { supabase } = await import('@/lib/supabase')
                          const { data: { session } } = await supabase.auth.getSession()
                          if (!session) return
                          
                          const res = await fetch('/api/test-subscription', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({ tier: tier.id })
                          })
                          
                          const result = await res.json()
                          
                          if (res.ok && result.success) {
                            const successMessage = tier.id === 'free'
                              ? 'Subscription canceled. You will retain access until the end of your billing period.'
                              : `Plan changed to ${tier.displayName}. Changes will take effect at the end of your billing period.`
                            toast.success(successMessage)
                            
                            // Wait a moment for database to commit
                            await new Promise(resolve => setTimeout(resolve, 500))
                            await handleSyncSubscription()
                          } else {
                            const errorMsg = result.error || 'Failed to change subscription'
                            console.error('Subscription change error:', errorMsg)
                            toast.error(errorMsg)
                          }
                        } catch (e) {
                          console.error('Subscription change exception:', e)
                          toast.error(`Failed to change subscription: ${e instanceof Error ? e.message : 'Unknown error'}`)
                        }
                      }
                    }}
                  >
                    {tier.id === 'free' ? 'Cancel Subscription' : `Downgrade to ${tier.displayName}`}
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Feature Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2">Feature</th>
                {SUBSCRIPTION_TIERS.map((tier) => (
                  <th key={tier.id} className="text-center py-3 px-2">
                    {tier.displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 px-2">Archetype Snapshot</td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-2">Live Odds Comparison</td>
                <td className="text-center py-3 px-2">—</td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-2">Analyze Your Bet</td>
                <td className="text-center py-3 px-2">—</td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-2">Line Movement Timeline</td>
                <td className="text-center py-3 px-2">—</td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-2">Bias Detection</td>
                <td className="text-center py-3 px-2">—</td>
                <td className="text-center py-3 px-2">—</td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-2">Expert Commentary</td>
                <td className="text-center py-3 px-2">—</td>
                <td className="text-center py-3 px-2">—</td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-2">AI-Generated Picks</td>
                <td className="text-center py-3 px-2">—</td>
                <td className="text-center py-3 px-2">—</td>
                <td className="text-center py-3 px-2">—</td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
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
              Help us improve Serenity Pocket by sharing some information about yourself.
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

      {/* Responsible Gambling Message */}
      <Card className="p-6 bg-muted">
        <h3 className="text-lg font-semibold text-foreground mb-2">Our Mission</h3>
        <p className="text-sm text-muted-foreground">
          Serenity Pocket exists to make betting smarter, not bigger. We're the seatbelt, not the gas pedal. 
          Our goal is to help you understand your psychology, recognize harmful patterns, and make more informed decisions. 
          Always bet responsibly and never wager more than you can afford to lose.
        </p>
      </Card>
    </div>
  )
}
