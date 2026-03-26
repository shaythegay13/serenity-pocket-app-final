/**
 * One-time admin backfill endpoint.
 * Fixes two gaps in user_profiles:
 *   1. Survey scores (pgsi_score, risk_level, archetype, emotional_stability)
 *      re-derived from raw responses in anonymous_survey_submissions
 *   2. total_trades / mindful_trades re-counted from comprehensive_bets
 *
 * Protected by ADMIN_BACKFILL_SECRET env var.
 * Call with: POST /api/admin/backfill-profiles
 *            Authorization: Bearer <ADMIN_BACKFILL_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { surveyService } from '@/lib/services/survey-service'

export async function POST(request: NextRequest) {
  // Simple secret-key guard — no user session needed
  const secret = process.env.ADMIN_BACKFILL_SECRET
  const auth = request.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    surveyScoresUpdated: 0,
    surveyScoresSkipped: 0,
    tradeCountsUpdated: 0,
    errors: [] as string[],
  }

  // ─── 1. Survey score backfill ────────────────────────────────────────────
  // Find users who have no survey scores yet but have an entry in
  // anonymous_survey_submissions matched by email.
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email')
    .or('survey_completed.is.null,survey_completed.eq.false')
    .not('email', 'is', null)

  if (profilesError) {
    results.errors.push(`Failed to fetch profiles: ${profilesError.message}`)
  } else if (profiles) {
    for (const profile of profiles) {
      try {
        // Look up the most recent anonymous submission for this email
        const { data: submission } = await supabaseAdmin
          .from('anonymous_survey_submissions')
          .select('responses, score')
          .eq('email', profile.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!submission?.responses) {
          results.surveyScoresSkipped++
          continue
        }

        // The responses field was stored as a raw SurveyAnswer array
        const rawResponses = Array.isArray(submission.responses)
          ? submission.responses
          : (submission.responses as any).responses ?? []

        if (!rawResponses.length) {
          results.surveyScoresSkipped++
          continue
        }

        // Re-derive all scores from raw responses
        const derived = surveyService.calculateUnifiedScores(rawResponses)

        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            serenity_score:      submission.score ?? derived.serenityScore,
            pgsi_score:          derived.pgsiScore,
            emotional_stability: derived.emotionalStability,
            risk_level:          derived.riskLevel,
            archetype:           derived.archetype.name,
            survey_completed:    true,
          })
          .eq('id', profile.id)

        if (updateError) {
          results.errors.push(`Survey update failed for ${profile.id}: ${updateError.message}`)
        } else {
          results.surveyScoresUpdated++
        }
      } catch (err: any) {
        results.errors.push(`Exception for ${profile.id}: ${err.message}`)
      }
    }
  }

  // ─── 2. Trade count backfill ─────────────────────────────────────────────
  // Re-count total_trades and mindful_trades directly from comprehensive_bets.
  // A bet is "mindful" when the user logged both a before AND after emotion.
  const { data: betCounts, error: betError } = await supabaseAdmin
    .from('comprehensive_bets')
    .select('user_id, emotions')

  if (betError) {
    results.errors.push(`Failed to fetch bet counts: ${betError.message}`)
  } else if (betCounts) {
    // Aggregate per user
    const perUser: Record<string, { total: number; mindful: number }> = {}
    for (const row of betCounts) {
      if (!row.user_id) continue
      if (!perUser[row.user_id]) perUser[row.user_id] = { total: 0, mindful: 0 }
      perUser[row.user_id].total++

      const before = row.emotions?.before?.emotion
      const after  = row.emotions?.after?.emotion
      if (before && after) perUser[row.user_id].mindful++
    }

    for (const [userId, counts] of Object.entries(perUser)) {
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          total_trades:  counts.total,
          mindful_trades: counts.mindful,
        })
        .eq('id', userId)

      if (updateError) {
        results.errors.push(`Trade update failed for ${userId}: ${updateError.message}`)
      } else {
        results.tradeCountsUpdated++
      }
    }
  }

  return NextResponse.json(results)
}
