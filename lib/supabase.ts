import { createClient } from "@supabase/supabase-js"

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

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
