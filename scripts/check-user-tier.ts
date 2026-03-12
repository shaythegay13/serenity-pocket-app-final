/**
 * Check user subscription tier and AI usage limits
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.time('Execution Time')
  console.log('🔍 Checking user profiles and AI usage limits...\n')

  // Get all users
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.error('❌ Error fetching users:', usersError)
    return
  }

  if (!users || users.users.length === 0) {
    console.log('⚠️  No users found in the system')
    return
  }

  console.log(`Found ${users.users.length} user(s)\n`)

  // Pre-fetch all usage limits to cache them by tier
  const { data: allLimits, error: allLimitsError } = await supabase
    .from('ai_usage_limits')
    .select('*')
    .order('tier')

  const limitsByTier = new Map(allLimits?.map(limit => [limit.tier, limit]) || [])

  // Pre-fetch all user profiles in a single query
  const userIds = users.users.map(u => u.id)

  // Batch processing in chunks if there are too many users, though typical usage is under limits
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, subscription_tier, email')
    .in('id', userIds)

  const profilesById = new Map(profiles?.map(p => [p.id, p]) || [])

  // Check current week's usage
  const userIds = users.users.map(u => u.id)

  const getWeekStart = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }

  const weekStart = getWeekStart()

  for (const user of users.users) {
    const profile = profilesById.get(user.id)
  const weekStart = getWeekStart()

  // Batch queries
  const [
    { data: profilesData, error: profilesError },
    { data: allLimits, error: allLimitsError },
    { data: pickerUsageData, error: pickerError },
    { data: analyzerUsageData, error: analyzerError }
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, subscription_tier, email')
      .in('id', userIds),
    supabase
      .from('ai_usage_limits')
      .select('*')
      .order('tier'),
    supabase
      .from('ai_service_usage')
      .select('user_id', { count: 'exact' })
      .in('user_id', userIds)
      .eq('service_type', 'ai_picker')
      .eq('week_start_date', weekStart),
    supabase
      .from('ai_service_usage')
      .select('user_id', { count: 'exact' })
      .in('user_id', userIds)
      .eq('service_type', 'ai_bet_analyzer')
      .eq('week_start_date', weekStart)
  ])

  // Group data for O(1) lookups
  const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
  const limitsMap = new Map(allLimits?.map(l => [l.tier, l]) || [])

  // Since we want exact counts grouped by user_id and Supabase `select` with `count`
  // without grouped columns returns a total count, we'll manually aggregate the usages
  // from a separate query to get individual counts per user.
  const pickerUsageCounts = new Map<string, number>()
  if (pickerUsageData) {
    for (const row of pickerUsageData) {
      pickerUsageCounts.set(row.user_id, (pickerUsageCounts.get(row.user_id) || 0) + 1)
    }
  }

  const analyzerUsageCounts = new Map<string, number>()
  if (analyzerUsageData) {
    for (const row of analyzerUsageData) {
      analyzerUsageCounts.set(row.user_id, (analyzerUsageCounts.get(row.user_id) || 0) + 1)
    }
  }

  for (const user of users.users) {
    const profile = profilesMap.get(user.id)
    console.log(`👤 User: ${user.email || user.id}`)

    if (profilesError || !profile) {
      console.log('   ❌ Profile not found or error:', profilesError?.message || 'Profile not found')
      console.log('   ❌ Profile not found or error:', profilesError?.message)
      continue
    }

    const tier = profile.subscription_tier || 'free'
    console.log(`   📊 Subscription Tier: ${tier}`)

    // Use cached limits
    const limits = limitsByTier.get(tier)
    // Check tier limits
    const limits = limitsMap.get(tier)

    if (!limits) {
      console.log('   ❌ No limits found for tier:', tier)
    } else {
      console.log(`   ✅ AI Picker Weekly Limit: ${limits.ai_picker_weekly_limit}`)
      console.log(`   ✅ AI Bet Analyzer Weekly Limit: ${limits.ai_bet_analyzer_weekly_limit}`)
    }

    // Fetch usage counts concurrently
    const [pickerUsageResult, analyzerUsageResult] = await Promise.all([
      supabase
        .from('ai_service_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('service_type', 'ai_picker')
        .eq('week_start_date', weekStart),
      supabase
        .from('ai_service_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('service_type', 'ai_bet_analyzer')
        .eq('week_start_date', weekStart)
    ])

    const { count: pickerUsage } = pickerUsageResult
    const { count: analyzerUsage } = analyzerUsageResult
    const pickerUsage = pickerUsageCounts.get(user.id) || 0
    const analyzerUsage = analyzerUsageCounts.get(user.id) || 0

    console.log(`   📈 This Week's Usage (starting ${weekStart}):`)
    console.log(`      AI Picker: ${pickerUsage} uses`)
    console.log(`      AI Bet Analyzer: ${analyzerUsage} uses`)
    console.log('')
  }

  // Show all tier limits
  console.log('📋 All Tier Limits:')

  if (allLimitsError || !allLimits) {
    console.log('   ❌ Error fetching limits:', allLimitsError)
  } else {
    for (const limit of allLimits) {
      console.log(`   ${limit.tier.padEnd(15)} -> Picker: ${limit.ai_picker_weekly_limit}, Analyzer: ${limit.ai_bet_analyzer_weekly_limit}`)
    }
  }

  console.timeEnd('Execution Time')
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
