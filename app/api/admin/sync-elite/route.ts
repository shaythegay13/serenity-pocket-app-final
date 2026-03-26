/**
 * Admin endpoint to manually sync elite subscription tier for a list of user emails.
 * Use when Flowglad webhooks missed subscribers (e.g. metadata was missing at checkout time).
 *
 * POST /api/admin/sync-elite
 * Authorization: Bearer <ADMIN_BACKFILL_SECRET>
 * Body: { "emails": ["user1@example.com", "user2@example.com"] }
 *
 * Returns per-email result: updated, not_found, or error.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_BACKFILL_SECRET
  const auth = request.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let emails: string[]
  try {
    const body = await request.json()
    emails = body.emails
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Provide a non-empty "emails" array' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const results: Record<string, 'updated' | 'not_found' | string> = {}

  for (const email of emails) {
    const normalised = email.trim().toLowerCase()
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, subscription_tier')
      .ilike('email', normalised)
      .maybeSingle()

    if (fetchError) {
      results[normalised] = `error: ${fetchError.message}`
      continue
    }
    if (!profile) {
      results[normalised] = 'not_found'
      continue
    }

    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_tier: 'elite',
        subscription_status: 'active',
      })
      .eq('id', profile.id)

    results[normalised] = updateError ? `error: ${updateError.message}` : 'updated'
  }

  const updated = Object.values(results).filter(v => v === 'updated').length
  const notFound = Object.values(results).filter(v => v === 'not_found').length
  const errors = Object.values(results).filter(v => v.startsWith('error')).length

  return NextResponse.json({ summary: { updated, notFound, errors }, results })
}
