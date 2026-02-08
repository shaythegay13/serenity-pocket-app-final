/**
 * AI Service Usage Tracker
 * 
 * Manages usage limits and tracking for SmartSlip and TiltLab services.
 * Supports tier-based weekly limits + purchased credits from marketplace.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export type AIServiceType = 'ai_picker' | 'ai_bet_analyzer'

export interface UsageCheckResult {
  canUse: boolean
  remaining: number
  limit: number
  usedThisWeek: number
  purchasedCredits: number
  totalAvailable: number
  tier?: string
  reason?: string
}

export interface UsageStats {
  aiPicker: UsageCheckResult
  aiBetAnalyzer: UsageCheckResult
  weekStartDate: string
}

/**
 * Get the Monday of the current week (usage resets weekly on Monday)
 */
export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  // If Sunday (0), go back 6 days; otherwise go back (day - 1) days
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0] // YYYY-MM-DD
}

/**
 * Check if user can use an AI service
 * 
 * @param supabase - Supabase client instance
 * @param userId - User's UUID
 * @param serviceType - 'ai_picker' or 'ai_bet_analyzer'
 * @returns Usage check result with limits and availability
 */
export async function checkAIServiceUsage(
  supabase: SupabaseClient,
  userId: string,
  serviceType: AIServiceType
): Promise<UsageCheckResult> {
  try {
    // 1. Get user's current subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('[AI Usage Tracker] Profile fetch error:', profileError)
      return {
        canUse: false,
        remaining: 0,
        limit: 0,
        usedThisWeek: 0,
        purchasedCredits: 0,
        totalAvailable: 0,
        tier: undefined,
        reason: 'Profile not found'
      }
    }

    const tier = profile.subscription_tier || 'free'

    // 2. Get tier-based weekly limits
    const { data: limits, error: limitsError } = await supabase
      .from('ai_usage_limits')
      .select('*')
      .eq('tier', tier)
      .single()

    if (limitsError || !limits) {
      console.error('[AI Usage Tracker] Limits fetch error:', limitsError)
      return {
        canUse: false,
        remaining: 0,
        limit: 0,
        usedThisWeek: 0,
        purchasedCredits: 0,
        totalAvailable: 0,
        tier,
        reason: 'Tier limits not configured'
      }
    }

    const tierLimit = serviceType === 'ai_picker'
      ? limits.ai_picker_weekly_limit
      : limits.ai_bet_analyzer_weekly_limit

    // 3. Count usage this week
    const weekStart = getWeekStartDate()
    const { count: usedCount, error: usageError } = await supabase
      .from('ai_service_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('service_type', serviceType)
      .eq('week_start_date', weekStart)

    if (usageError) {
      console.error('[AI Usage Tracker] Usage count error:', usageError)
    }

    const usedThisWeek = usedCount || 0

    // 4. Count purchased credits available (not expired)
    const creditField = serviceType === 'ai_picker'
      ? 'ai_picker_credits'
      : 'ai_bet_analyzer_credits'

    const { data: purchases, error: purchasesError } = await supabase
      .from('ai_usage_purchases')
      .select(creditField)
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

    if (purchasesError) {
      console.error('[AI Usage Tracker] Purchases fetch error:', purchasesError)
    }

    let purchasedCredits = 0
    if (purchases && purchases.length > 0) {
      purchasedCredits = purchases.reduce((sum, p) => {
        const credits = (p as any)[creditField] || 0
        return sum + credits
      }, 0)
    }

    // 5. Calculate availability (using database-defined tier limits)
    const totalAvailable = tierLimit + purchasedCredits
    const remaining = Math.max(0, totalAvailable - usedThisWeek)
    const canUse = remaining > 0

    let reason: string | undefined
    if (!canUse) {
      if (tierLimit === 0) {
        reason = 'This feature requires a Premium subscription or higher. Upgrade to unlock AI services.'
      } else {
        reason = 'Weekly limit reached. Purchase additional uses in the Marketplace or upgrade your plan.'
      }
    }

    return {
      canUse,
      remaining,
      limit: tierLimit,
      usedThisWeek,
      purchasedCredits,
      totalAvailable,
      tier,
      reason: canUse ? undefined : purchasedCredits > 0 ? 'Weekly limit reached (use purchased credits)' : 'Weekly limit reached'
    }
  } catch (error) {
    console.error('[AI Usage Tracker] Exception:', error)
    return {
      canUse: false,
      remaining: 0,
      limit: 0,
      usedThisWeek: 0,
      purchasedCredits: 0,
      totalAvailable: 0,
      tier: undefined,
      reason: 'Usage check failed'
    }
  }
}

/**
 * Record AI service usage
 * 
 * @param supabase - Supabase client instance
 * @param userId - User's UUID
 * @param serviceType - 'ai_picker' or 'ai_bet_analyzer'
 * @param requestMetadata - Optional metadata about the request (for audit/analytics)
 * @returns Success status
 */
export async function recordAIServiceUsage(
  supabase: SupabaseClient,
  userId: string,
  serviceType: AIServiceType,
  requestMetadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const weekStart = getWeekStartDate()

    // Get user's tier at time of use
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('[AI Usage Tracker] Profile fetch error:', profileError)
      return { success: false, error: 'Profile not found' }
    }

    const { error: insertError } = await supabase
      .from('ai_service_usage')
      .insert({
        user_id: userId,
        service_type: serviceType,
        week_start_date: weekStart,
        tier_at_time_of_use: profile.subscription_tier || 'free',
        request_metadata: requestMetadata || {}
      })

    if (insertError) {
      console.error('[AI Usage Tracker] Failed to record usage:', insertError)
      return { success: false, error: insertError.message }
    }

    console.log(`✅ [AI Usage Tracker] Recorded ${serviceType} usage for user ${userId}`)
    return { success: true }
  } catch (error) {
    console.error('[AI Usage Tracker] Unexpected error in recordAIServiceUsage:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Get comprehensive usage stats for a user
 * 
 * @param supabase - Supabase client instance
 * @param userId - User's UUID
 * @returns Usage stats for both AI services
 */
export async function getUserAIUsageStats(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageStats> {
  const [pickerCheck, analyzerCheck] = await Promise.all([
    checkAIServiceUsage(supabase, userId, 'ai_picker'),
    checkAIServiceUsage(supabase, userId, 'ai_bet_analyzer')
  ])

  return {
    aiPicker: pickerCheck,
    aiBetAnalyzer: analyzerCheck,
    weekStartDate: getWeekStartDate()
  }
}

/**
 * Deduct purchased credits when used
 * This is called automatically when recording usage
 * 
 * @param supabase - Supabase client instance (with service role for admin operations)
 * @param userId - User's UUID
 * @param serviceType - 'ai_picker' or 'ai_bet_analyzer'
 * @returns Success status
 */
export async function deductPurchasedCredit(
  supabase: SupabaseClient,
  userId: string,
  serviceType: AIServiceType
): Promise<{ success: boolean; error?: string }> {
  try {
    const creditField = serviceType === 'ai_picker'
      ? 'ai_picker_credits'
      : 'ai_bet_analyzer_credits'

    // Find the oldest purchase with available credits
    const { data: purchases, error: fetchError } = await supabase
      .from('ai_usage_purchases')
      .select('*')
      .eq('user_id', userId)
      .gt(creditField, 0)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order('purchased_at', { ascending: true })
      .limit(1)

    if (fetchError) {
      console.error('[AI Usage Tracker] Error fetching purchases:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!purchases || purchases.length === 0) {
      // No purchased credits to deduct (user is using tier allowance)
      return { success: true }
    }

    const purchase = purchases[0]
    const newCreditAmount = (purchase[creditField] || 0) - 1

    // Update the purchase record
    const { error: updateError } = await supabase
      .from('ai_usage_purchases')
      .update({ [creditField]: Math.max(0, newCreditAmount) })
      .eq('id', purchase.id)

    if (updateError) {
      console.error('[AI Usage Tracker] Error deducting credit:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`✅ [AI Usage Tracker] Deducted 1 ${serviceType} credit from purchase ${purchase.id}`)
    return { success: true }
  } catch (error) {
    console.error('[AI Usage Tracker] Unexpected error in deductPurchasedCredit:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
