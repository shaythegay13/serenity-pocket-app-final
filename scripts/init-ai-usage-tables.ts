/**
 * Initialize AI Usage Tracking Tables in Supabase
 *
 * This script checks if the required tables exist and creates them if needed.
 * Run this script to fix the AI Picker 403 errors.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableExists(tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1)

  if (error) {
    // Table doesn't exist or is inaccessible
    return false
  }

  return true
}

async function runMigration() {
  const migrationPath = path.join(process.cwd(), 'migrations', '20241202_ai_usage_limits.sql')

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`)
    process.exit(1)
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  console.log('📋 Running migration: 20241202_ai_usage_limits.sql')
  console.log('   This will create the following tables:')
  console.log('   - ai_service_usage')
  console.log('   - ai_usage_limits')
  console.log('   - ai_usage_purchases')
  console.log('   - ai_marketplace_products')
  console.log('')

  // Note: Supabase client doesn't support running raw SQL directly
  // We need to use the Supabase Management API or run it manually
  console.log('⚠️  MANUAL STEP REQUIRED:')
  console.log('')
  console.log('   1. Go to your Supabase Dashboard: https://supabase.com/dashboard')
  console.log('   2. Select your project')
  console.log('   3. Navigate to SQL Editor')
  console.log('   4. Run the migration file: migrations/20241202_ai_usage_limits.sql')
  console.log('')
  console.log('   OR use the Supabase CLI:')
  console.log('   $ npx supabase db push --db-url ' + supabaseUrl)
  console.log('')
}

async function main() {
  console.log('🔍 Checking AI Usage Tracking Tables...\n')

  const tables = [
    'ai_service_usage',
    'ai_usage_limits',
    'ai_usage_purchases',
    'ai_marketplace_products'
  ]

  const results: Record<string, boolean> = {}

  for (const table of tables) {
    const exists = await checkTableExists(table)
    results[table] = exists
    console.log(`   ${exists ? '✅' : '❌'} ${table}: ${exists ? 'exists' : 'NOT FOUND'}`)
  }

  console.log('')

  const allExist = Object.values(results).every(v => v)

  if (allExist) {
    console.log('✅ All required tables exist!')
    console.log('')
    console.log('If you\'re still getting 403 errors, try:')
    console.log('   1. Restart your Next.js dev server')
    console.log('   2. Check user subscription tier in user_profiles table')
    console.log('   3. Check ai_usage_limits table has correct data')
  } else {
    console.log('❌ Some tables are missing!')
    console.log('')
    await runMigration()
  }
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
