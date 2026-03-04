// lib/services/survey-service.ts

import { supabase } from '@/lib/supabase';
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
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          serenity_score: results.serenityScore,
          pgsi_score: results.pgsiScore,
          emotional_stability: results.emotionalStability,
          risk_level: results.riskLevel,
          archetype: results.archetype.name,
          survey_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) console.error('Error updating profile:', profileError);
    }

    return results;
  }

  private calculateUnifiedScores(responses: SurveyAnswer[]): UnifiedSurveyResult {
    let serenityTotal = 0;
    let maxSerenityPossible = 0;
    let pgsiTotal = 0;

    responses.forEach(response => {
      const question = ENHANCED_SURVEY_QUESTIONS.find(q => q.id === response.questionId);
      if (!question) return;
      const answerIndex = question.options.indexOf(response.selectedOption);
      if (answerIndex === -1) return;

      if (question.category !== 'pgsi') {
        serenityTotal += question.weight![answerIndex];
        maxSerenityPossible += Math.max(...question.weight!);
      }

      if (question.category !== 'serenity') {
        pgsiTotal += question.pgsiWeight![answerIndex];
      }
    });

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