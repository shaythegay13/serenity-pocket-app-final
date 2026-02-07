import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check for missing environment variables (only warn in browser, not during build)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('❌ CRITICAL: Supabase environment variables are missing! Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('Current values:', {
    url: supabaseUrl ? 'present' : 'MISSING',
    key: supabaseAnonKey ? 'present' : 'MISSING'
  })
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('⚠️ Invalid Supabase URL format:', supabaseUrl)
}

// Browser Supabase client (persist session in localStorage)
// Use placeholder values during build to prevent createClient from throwing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false, // Disabled to reduce console spam
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
    // Clear any remaining Supabase localStorage items
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.')) {
          localStorage.removeItem(key)
        }
      })
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('supabase.')) {
          sessionStorage.removeItem(key)
        }
      })
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
