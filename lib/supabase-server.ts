import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKeyRaw = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables for server client');
  if (process.env.NODE_ENV === 'development') {
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Validate service role key - reject placeholder values
const isValidServiceKey = supabaseServiceKeyRaw &&
  !supabaseServiceKeyRaw.includes('your_service_role_key') &&
  !supabaseServiceKeyRaw.includes('placeholder') &&
  supabaseServiceKeyRaw.length > 20; // Supabase keys are typically much longer

const supabaseServiceKey = isValidServiceKey ? supabaseServiceKeyRaw : undefined;

if (supabaseServiceKeyRaw && !isValidServiceKey) {
  console.warn('⚠️  Invalid SUPABASE_SERVICE_ROLE_KEY detected (placeholder value). Using anon key instead.');
  console.warn('   To fix: Add your real service role key from Supabase Dashboard → Settings → API');
}

/**
 * Server-side Supabase client.
 * Uses service role key if available (bypasses RLS), otherwise uses anon key.
 * Should only be used in server-side code (API routes, server components).
 * DO NOT expose this client to the browser.
 */
export const supabaseServer = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
