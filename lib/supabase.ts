import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '❌ CRITICAL: Supabase environment variables are missing! Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'

  if (typeof window !== 'undefined') {
    console.error(errorMsg)
    console.error('Current values:', {
      url: supabaseUrl ? 'present' : 'MISSING',
      key: supabaseAnonKey ? 'present' : 'MISSING'
    })
  }

  // Throw error in development to catch this early
  if (process.env.NODE_ENV === 'development') {
    throw new Error(errorMsg)
  }
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('⚠️ Invalid Supabase URL format:', supabaseUrl)
}

// Use createClientComponentClient for cookie-based auth that works with API routes
export const supabase = createClientComponentClient()
