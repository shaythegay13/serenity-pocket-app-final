import { createClient } from '@supabase/supabase-js'

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

// Browser Supabase client (persist session in localStorage)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-timeout': '5000',
    },
  },
})

// Helper function to clear auth state when refresh token errors occur
export const clearStaleAuth = async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' })
    // Clear any remaining localStorage items
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.refreshToken')
    }
  } catch (error) {
    console.log('Cleared auth state')
  }
}

// Handle refresh token errors
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    console.log('Token refresh failed, clearing auth state')
    clearStaleAuth()
  }
})
