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

  for (const user of users.users) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, subscription_tier, email')
      .eq('id', user.id)
      .single()

    console.log(`👤 User: ${user.email || user.id}`)

    if (profileError || !profile) {
      console.log('   ❌ Profile not found or error:', profileError?.message)
      continue
    }

    const tier = profile.subscription_tier || 'free'
    console.log(`   📊 Subscription Tier: ${tier}`)

    // Check tier limits
    const { data: limits, error: limitsError } = await supabase
      .from('ai_usage_limits')
      .select('*')
      .eq('tier', tier)
      .single()

    if (limitsError || !limits) {
      console.log('   ❌ No limits found for tier:', tier)
    } else {
      console.log(`   ✅ AI Picker Weekly Limit: ${limits.ai_picker_weekly_limit}`)
      console.log(`   ✅ AI Bet Analyzer Weekly Limit: ${limits.ai_bet_analyzer_weekly_limit}`)
    }

    // Check current week's usage
    const getWeekStart = () => {
      const d = new Date()
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      d.setDate(diff)
      d.setHours(0, 0, 0, 0)
      return d.toISOString().split('T')[0]
    }

    const weekStart = getWeekStart()

    const { count: pickerUsage, error: pickerError } = await supabase
      .from('ai_service_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('service_type', 'ai_picker')
      .eq('week_start_date', weekStart)

    const { count: analyzerUsage, error: analyzerError } = await supabase
      .from('ai_service_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('service_type', 'ai_bet_analyzer')
      .eq('week_start_date', weekStart)

    console.log(`   📈 This Week's Usage (starting ${weekStart}):`)
    console.log(`      AI Picker: ${pickerUsage || 0} uses`)
    console.log(`      AI Bet Analyzer: ${analyzerUsage || 0} uses`)
    console.log('')
  }

  // Show all tier limits
  console.log('📋 All Tier Limits:')
  const { data: allLimits, error: allLimitsError } = await supabase
    .from('ai_usage_limits')
    .select('*')
    .order('tier')

  if (allLimitsError || !allLimits) {
    console.log('   ❌ Error fetching limits:', allLimitsError)
  } else {
    for (const limit of allLimits) {
      console.log(`   ${limit.tier.padEnd(15)} -> Picker: ${limit.ai_picker_weekly_limit}, Analyzer: ${limit.ai_bet_analyzer_weekly_limit}`)
    }
  }
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
