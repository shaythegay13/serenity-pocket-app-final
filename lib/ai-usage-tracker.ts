/**
 * AI Service Usage Tracker
 *
 * Manages usage limits and tracking for SmartSlip and TiltLab services.
 * Supports tier-based weekly limits + purchased credits from marketplace.
 *
 * NEW: Unified "AI-guided decision" system — 1 decision = SmartSlip + TiltLab full flow.
 * Use checkDecisionUsage / recordDecisionUsage / deductDecisionCredit for all new code.
 * Legacy per-service functions kept for backward compatibility only.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export type AIServiceType = 'ai_picker' | 'ai_bet_analyzer' | 'ai_decision'

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

// ─── Unified Decision Types ───────────────────────────────────────────────────

export interface DecisionCheckResult {
  canUse: boolean
  remaining: number
  weeklyLimit: number
  usedThisWeek: number
  purchasedCredits: number
  totalAvailable: number
  tier?: string
  reason?: string
}

export interface DecisionStats {
  decisions: DecisionCheckResult
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

// ─────────────────────────────────────────────────────────────────────────────
// Unified AI-Guided Decision Functions
// Use these for all new SmartSlip / TiltLab gating logic.
// 1 decision = 1 full SmartSlip + TiltLab flow, consumed at TiltLab completion.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether a user has AI-guided decisions available.
 *
 * Free-tier users cannot use marketplace-purchased credits (paid sub required).
 */
export async function checkDecisionUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<DecisionCheckResult> {
  try {
    // 1. Fetch subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('[Decision Tracker] Profile fetch error:', profileError)
      return {
        canUse: false, remaining: 0, weeklyLimit: 0,
        usedThisWeek: 0, purchasedCredits: 0, totalAvailable: 0,
        reason: 'Profile not found',
      }
    }

    const tier = profile.subscription_tier || 'free'

    // 2. Fetch weekly decision limit for this tier
    const { data: limits, error: limitsError } = await supabase
      .from('ai_usage_limits')
      .select('ai_decisions_weekly_limit')
      .eq('tier', tier)
      .single()

    if (limitsError || !limits) {
      console.error('[Decision Tracker] Limits fetch error:', limitsError)
      return {
        canUse: false, remaining: 0, weeklyLimit: 0,
        usedThisWeek: 0, purchasedCredits: 0, totalAvailable: 0,
        tier,
        reason: 'Tier limits not configured',
      }
    }

    const weeklyLimit: number = (limits as any).ai_decisions_weekly_limit ?? 0

    // 3. Count decisions used this week
    const weekStart = getWeekStartDate()
    const { count: usedCount, error: usageError } = await supabase
      .from('ai_service_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('service_type', 'ai_decision')
      .eq('week_start_date', weekStart)

    if (usageError) {
      console.error('[Decision Tracker] Usage count error:', usageError)
    }

    const usedThisWeek = usedCount || 0

    // 4. Count purchased decision credits (only for paid subscribers)
    let purchasedCredits = 0
    if (tier !== 'free') {
      const { data: purchases, error: purchasesError } = await supabase
        .from('ai_usage_purchases')
        .select('decision_credits')
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

      if (purchasesError) {
        console.error('[Decision Tracker] Purchases fetch error:', purchasesError)
      }

      if (purchases && purchases.length > 0) {
        purchasedCredits = purchases.reduce(
          (sum, p) => sum + ((p as any).decision_credits || 0),
          0,
        )
      }
    }

    // 5. Compute balance
    const totalAvailable = weeklyLimit + purchasedCredits
    const remaining = Math.max(0, totalAvailable - usedThisWeek)
    const canUse = remaining > 0

    let reason: string | undefined
    if (!canUse) {
      if (tier === 'free') {
        reason = 'Upgrade to Focus or higher to unlock AI-guided decisions.'
      } else {
        reason = 'Weekly AI-guided decisions used. Purchase more decisions to continue.'
      }
    }

    return {
      canUse, remaining, weeklyLimit,
      usedThisWeek, purchasedCredits, totalAvailable,
      tier, reason,
    }
  } catch (error) {
    console.error('[Decision Tracker] Exception in checkDecisionUsage:', error)
    return {
      canUse: false, remaining: 0, weeklyLimit: 0,
      usedThisWeek: 0, purchasedCredits: 0, totalAvailable: 0,
      reason: 'Decision check failed',
    }
  }
}

/**
 * Record that one AI-guided decision was consumed (called at TiltLab completion).
 */
export async function recordDecisionUsage(
  supabase: SupabaseClient,
  userId: string,
  requestMetadata?: Record<string, any>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const weekStart = getWeekStartDate()

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('[Decision Tracker] Profile fetch error:', profileError)
      return { success: false, error: 'Profile not found' }
    }

    const { error: insertError } = await supabase
      .from('ai_service_usage')
      .insert({
        user_id: userId,
        service_type: 'ai_decision',
        week_start_date: weekStart,
        tier_at_time_of_use: profile.subscription_tier || 'free',
        request_metadata: requestMetadata || {},
      })

    if (insertError) {
      console.error('[Decision Tracker] Failed to record decision usage:', insertError)
      return { success: false, error: insertError.message }
    }

    console.log(`✅ [Decision Tracker] Recorded ai_decision usage for user ${userId}`)
    return { success: true }
  } catch (error) {
    console.error('[Decision Tracker] Unexpected error in recordDecisionUsage:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Deduct 1 purchased decision credit (FIFO — oldest purchase first).
 * Only called when the user is using a purchased credit (not tier allowance).
 */
export async function deductDecisionCredit(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: purchases, error: fetchError } = await supabase
      .from('ai_usage_purchases')
      .select('*')
      .eq('user_id', userId)
      .gt('decision_credits', 0)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order('purchased_at', { ascending: true })
      .limit(1)

    if (fetchError) {
      console.error('[Decision Tracker] Error fetching purchases:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!purchases || purchases.length === 0) {
      // No purchased credits — user is drawing from weekly tier allowance, nothing to deduct
      return { success: true }
    }

    const purchase = purchases[0]
    const newAmount = Math.max(0, ((purchase as any).decision_credits || 0) - 1)

    const { error: updateError } = await supabase
      .from('ai_usage_purchases')
      .update({ decision_credits: newAmount })
      .eq('id', purchase.id)

    if (updateError) {
      console.error('[Decision Tracker] Error deducting decision credit:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`✅ [Decision Tracker] Deducted 1 decision credit from purchase ${purchase.id}`)
    return { success: true }
  } catch (error) {
    console.error('[Decision Tracker] Unexpected error in deductDecisionCredit:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Get comprehensive decision stats for a user.
 */
export async function getUserDecisionStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<DecisionStats> {
  const decisions = await checkDecisionUsage(supabase, userId)
  return {
    decisions,
    weekStartDate: getWeekStartDate(),
  }
}
