// lib/services/survey-service.ts
// NOTE: This service runs server-side only (called from API routes).
// It uses supabaseAdmin to bypass RLS — the API routes are responsible
// for authenticating the caller before invoking these methods.

import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { SurveyAnswer } from '@/types/survey';
import { ENHANCED_SURVEY_QUESTIONS, UnifiedSurveyResult } from '@/types/survey.enhanced';
import { isFeatureEnabled } from '@/lib/features/flags';
import { computeArchetype } from '@/lib/archetypes';

export interface SurveySubmissionResult extends UnifiedSurveyResult {
  surveyId: string; // only here, not inside UnifiedSurveyResult
}

export class SurveyService {
  async submitSurvey(
    userId: string | null,
    anonymousId: string | null,
    responses: SurveyAnswer[],
    surveyId: string = 'default-survey-id'
  ): Promise<SurveySubmissionResult> {
    this.validateResponses(responses);

    // Calculate unified scores (typed strictly as UnifiedSurveyResult)
    const baseResults: UnifiedSurveyResult = this.calculateUnifiedScores(responses);

    // Extend the object with surveyId outside of the type
    const results: SurveySubmissionResult = { ...baseResults, surveyId };

    const responsesWithType = {
      _surveyType: isFeatureEnabled('HYBRID_SURVEY') ? 'serenity-pgsi-hybrid' : 'serenity',
      _version: '1.0',
      responses: responses.map(r => ({
        questionId: r.questionId,
        selectedOption: r.selectedOption,
        timestamp: r.timestamp
      }))
    };


    const { error: saveError } = await supabase
      .from('survey_responses')
      .insert({
        user_id: userId,
        anonymous_session_id: anonymousId,
        responses: responsesWithType,
        score: results.serenityScore,
        ...(isFeatureEnabled('PGSI_INTEGRATION') && {
          pgsi_score: results.pgsiScore,
          risk_level: results.riskLevel,
          emotional_stability: results.emotionalStability,
          archetype: results.archetype.name
        }),
        created_at: new Date().toISOString()
      });

    if (saveError) throw saveError;

    if (userId && isFeatureEnabled('PGSI_INTEGRATION')) {
      // Fetch existing survey_data to merge rather than overwrite other fields
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('survey_data')
        .eq('id', userId)
        .maybeSingle();

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          serenity_score:      results.serenityScore,
          pgsi_score:          results.pgsiScore,
          emotional_stability: results.emotionalStability,
          risk_level:          results.riskLevel,
          archetype:           results.archetype.name,
          survey_completed:    true,
          // Keep survey_data.userType in sync — this is what the UI reads
          survey_data: {
            ...((existing?.survey_data as object) ?? {}),
            score:    results.serenityScore,
            userType: results.archetype.name,
            level:    results.riskLevel,
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) console.error('Error updating profile:', profileError);
    }

    return results;
  }

  public calculateUnifiedScores(responses: SurveyAnswer[]): UnifiedSurveyResult {
    let serenityTotal = 0;
    let pgsiTotal = 0;

    responses.forEach(response => {
      const question = ENHANCED_SURVEY_QUESTIONS.find(q => q.id === response.questionId);
      if (!question) return;

      const options = Array.isArray(response.selectedOption)
        ? response.selectedOption
        : [response.selectedOption];

      options.forEach(opt => {
        const answerIndex = question.options.indexOf(opt);
        if (answerIndex === -1) return;

        if (question.category !== 'pgsi') {
          serenityTotal += question.weight![answerIndex];
        }

        if (question.category !== 'serenity') {
          pgsiTotal += question.pgsiWeight![answerIndex];
        }
      });
    });

    const maxSerenityPossible = ENHANCED_SURVEY_QUESTIONS.reduce((acc, q) => {
      if (q.category === 'pgsi') return acc;
      if (q.multi) return acc + q.weight!.reduce((s, w) => s + Math.max(0, w), 0);
      return acc + Math.max(...q.weight!);
    }, 0);

    const serenityScore = maxSerenityPossible > 0 ? Math.min(100, Math.round((serenityTotal / maxSerenityPossible) * 100)) : 0;
    const emotionalStability = this.calculateEmotionalStability(serenityScore, pgsiTotal);
    const archetype = computeArchetype(responses);

    return {
      serenityScore,
      pgsiScore: pgsiTotal,
      emotionalStability,
      archetype: {
        id: archetype.id,
        name: archetype.name,
        description: archetype.description,
        positive: archetype.positive,
        negative: archetype.negative
      },
      riskLevel: this.getRiskLevel(pgsiTotal),
      pgsiCategory: this.getPGSICategory(pgsiTotal)
    };
  }

  private calculateEmotionalStability(serenity: number, pgsi: number): number {
    const pgsiImpact = Math.min(100, (pgsi / 27) * 100);
    return Math.round((serenity * 0.6) + ((100 - pgsiImpact) * 0.4));
  }

  private getRiskLevel(pgsi: number): 'low' | 'moderate' | 'high' | 'problem' {
    if (pgsi === 0) return 'low';
    if (pgsi <= 4) return 'moderate';
    if (pgsi <= 7) return 'high';
    return 'problem';
  }

  private getPGSICategory(pgsi: number): string {
    if (pgsi === 0) return 'NON_PROBLEM';
    if (pgsi <= 2) return 'LOW_RISK';
    if (pgsi <= 7) return 'MODERATE_RISK';
    return 'PROBLEM_GAMBLER';
  }

  private validateResponses(responses: SurveyAnswer[]): void {
    if (!responses || responses.length === 0) throw new Error('No survey responses provided');
    const requiredIds = ENHANCED_SURVEY_QUESTIONS.filter(q => !q.multi).map(q => q.id);
    const answeredIds = new Set(responses.map(r => r.questionId));
    const missing = requiredIds.filter(id => !answeredIds.has(id));
    if (missing.length > 0) throw new Error(`Missing responses for questions: ${missing.join(', ')}`);
  }

  /**
   * After anonymous→authenticated migration, sync the latest survey response
   * scores back to user_profiles. Call this from both migration routes.
   */
  async syncProfileFromLatestSurvey(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('score, pgsi_score, emotional_stability, risk_level, archetype, responses')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return false;

    // Build update payload from whatever scores are available in the row
    const profileUpdate: Record<string, unknown> = { survey_completed: true };
    if (data.score != null)               profileUpdate.serenity_score    = data.score;
    if (data.pgsi_score != null)          profileUpdate.pgsi_score        = data.pgsi_score;
    if (data.emotional_stability != null) profileUpdate.emotional_stability = data.emotional_stability;
    if (data.risk_level != null)          profileUpdate.risk_level        = data.risk_level;
    if (data.archetype != null)           profileUpdate.archetype         = data.archetype;

    // Keep survey_data.userType in sync — the UI reads from this JSON blob
    if (data.archetype != null || data.score != null) {
      profileUpdate.survey_data = {
        ...(data.score != null    ? { score: data.score }        : {}),
        ...(data.archetype != null ? { userType: data.archetype } : {}),
        ...(data.risk_level != null ? { level: data.risk_level }  : {}),
      };
    }

    // If the row came from the email-based migration it may only have `score`.
    // Re-derive the missing fields from the raw responses if present.
    if ((data.pgsi_score == null || data.archetype == null) && data.responses) {
      try {
        const raw = data.responses as { responses?: { questionId: string; selectedOption: string | string[]; timestamp?: string }[] };
        const answers = raw.responses ?? [];
        if (answers.length > 0) {
          const mapped: SurveyAnswer[] = answers.map((r: any) => ({ questionId: r.questionId, selectedOption: r.selectedOption, timestamp: r.timestamp }));
          const derived = this.calculateUnifiedScores(mapped);
          if (data.pgsi_score == null)          profileUpdate.pgsi_score         = derived.pgsiScore;
          if (data.emotional_stability == null) profileUpdate.emotional_stability = derived.emotionalStability;
          if (data.risk_level == null)          profileUpdate.risk_level         = derived.riskLevel;
          if (data.archetype == null)           profileUpdate.archetype          = derived.archetype.name;
        }
      } catch {
        // If re-derivation fails, proceed with what we have
      }
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(profileUpdate)
      .eq('id', userId);

    if (updateError) {
      console.error('[SurveyService] Failed to sync profile after migration:', updateError);
      return false;
    }
    return true;
  }

  async hasTakenSurveyToday(userId: string | null, anonymousId: string | null): Promise<boolean> {
    if (!userId && !anonymousId) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);


    const { data, error } = await supabase
      .from('survey_responses')
      .select('id')
      .or(userId ? `user_id.eq.${userId}` : `anonymous_session_id.eq.${anonymousId}`)
      .gte('created_at', today.toISOString())
      .limit(1);
    if (error) return false;
    return data && data.length > 0;
  }
}

export const surveyService = new SurveyService();