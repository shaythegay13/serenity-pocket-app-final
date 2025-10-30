/**
 * Script to reset all achievements to their initial unlocked=false state
 * Run this to fix the issue where all achievements were incorrectly marked as achieved
 * 
 * Usage: npx ts-node scripts/reset-achievements.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase credentials not found in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function resetAchievements() {
  console.log('🔄 Resetting all achievements...')
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Error: Not authenticated. Please sign in first.')
      process.exit(1)
    }

    console.log(`✅ Authenticated as: ${user.email}`)

    // Update all achievements to unlocked=false
    const { data, error } = await supabase
      .from('achievements')
      .update({ 
        unlocked: false, 
        unlocked_at: null,
        progress: 0 
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Error resetting achievements:', error)
      process.exit(1)
    }

    console.log('✅ All achievements have been reset!')
    console.log('🎯 Achievements will now be earned based on your actual progress.')
    
    // Also clear localStorage flag
    console.log('\n📝 Note: Also clear your browser localStorage by running this in the browser console:')
    console.log('   localStorage.removeItem("serenity_profile_completed_awarded")')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

resetAchievements()
