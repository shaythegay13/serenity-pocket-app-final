/**
 * Public endpoint — returns number of founding elite spots remaining.
 * Uses service-role key server-side to bypass RLS and get accurate count.
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const TOTAL_FOUNDING_SPOTS = 100

export async function GET() {
  const { count, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_tier', 'elite')

  if (error) {
    console.error('[founding-spots] Failed to count elite members:', error)
    return NextResponse.json({ spotsLeft: TOTAL_FOUNDING_SPOTS }, { status: 200 })
  }

  const spotsLeft = Math.max(0, TOTAL_FOUNDING_SPOTS - (count ?? 0))
  return NextResponse.json({ spotsLeft })
}
