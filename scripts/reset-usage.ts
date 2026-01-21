/**
 * Reset AI Usage for Dev Account
 * 
 * This script resets the SmartSlip usage counters for a specific user.
 * Run this to clear usage limits during development/testing.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { getWeekStartDate } from '../lib/ai-usage-tracker'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetUserUsage(userEmail: string) {
  console.log(`🔄 Resetting AI usage for user: ${userEmail}`)
  
  try {
    // 1. Get user ID from email
    const { data: usersData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error listing users:', authError.message)
      return
    }
    
    const users = usersData.users || []
    const user = users.find((u: any) => u.email === userEmail)
    
    if (!user) {
      console.error('❌ User not found with email:', userEmail)
      console.log('💡 Available users:')
      users.forEach((u: any) => console.log(`   - ${u.email}`))
      return
    }
    
    const userId = user.id
    console.log(`✅ Found user ID: ${userId}`)
    
    // 2. Delete all AI service usage records for this user
    const { error: deleteUsageError } = await supabase
      .from('ai_service_usage')
      .delete()
      .eq('user_id', userId)
    
    if (deleteUsageError) {
      console.error('❌ Error deleting usage records:', deleteUsageError.message)
    } else {
      console.log('✅ Cleared all AI service usage records')
    }
    
    // 3. Optionally reset purchased credits (set to 0)
    const { error: resetCreditsError } = await supabase
      .from('ai_usage_purchases')
      .update({ 
        ai_picker_credits: 0,
        ai_bet_analyzer_credits: 0
      })
      .eq('user_id', userId)
    
    if (resetCreditsError) {
      console.log('ℹ️  No purchased credits to reset or error resetting credits:', resetCreditsError.message)
    } else {
      console.log('✅ Reset purchased credits to 0')
    }
    
    // 4. Show current status after reset
    const weekStart = getWeekStartDate()
    const { count: remainingUsage, error: countError } = await supabase
      .from('ai_service_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('week_start_date', weekStart)
    
    if (countError) {
      console.error('❌ Error checking remaining usage:', countError.message)
    } else {
      console.log(`✅ Usage reset complete. Current week usage: ${remainingUsage || 0}`)
    }
    
    // 5. Get user's subscription tier info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError.message)
    } else {
      console.log(`📋 User subscription tier: ${profile?.subscription_tier || 'free'}`)
    }
    
    console.log('\n🎉 Usage reset complete! You can now use SmartSlip again.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Get user email from command line arguments
const userEmail = process.argv[2]

if (!userEmail) {
  console.log('Usage: npx tsx scripts/reset-usage.ts <user-email>')
  console.log('')
  console.log('Example: npx tsx scripts/reset-usage.ts dev@example.com')
  console.log('')
  console.log('Common dev emails to try:')
  console.log('- test@example.com')
  console.log('- admin@example.com')
  console.log('- your-dev-email@example.com')
  process.exit(1)
}

resetUserUsage(userEmail)
