import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Warn if using placeholder values
if (typeof window !== 'undefined' && (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-anon-key')) {
  console.warn('⚠️ Supabase is not properly configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
