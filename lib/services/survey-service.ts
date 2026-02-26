import { supabase } from '@/lib/supabase';
import { SurveyAnswer } from '@/types/survey';
import { ENHANCED_SURVEY_QUESTIONS, UnifiedSurveyResult } from '@/types/survey.enhanced';
import { isFeatureEnabled } from '@/lib/features/flags';
import { computeArchetype } from '@/lib/archetypes';

export class SurveyService {
  /**
   * Submit survey with unified scoring
   * Follows POST → GenerateKey pattern from architecture
   */
  async submitSurvey(
    userId: string | null,
    anonymousId: string | null,
    responses: SurveyAnswer[]
  ): Promise<UnifiedSurveyResult> {
    // Validate responses
    this.validateResponses(responses);

    // Calculate unified scores
    const results = this.calculateUnifiedScores(responses);

    // Prepare responses with survey type marker
    const responsesWithType = {
      _surveyType: isFeatureEnabled('HYBRID_SURVEY') ? 'serenity-pgsi-hybrid' : 'serenity',
      _version: '1.0',
      responses: responses.map(r => ({
        questionId: r.questionId,
        selectedOption: r.selectedOption,
        timestamp: r.timestamp
      }))
    };

    // Insert into survey_responses table
    const { error: saveError } = await supabase
      .from('survey_responses')
      .insert({
        user_id: userId,
        anonymous_session_id: anonymousId,
        responses: responsesWithType,
        score: results.serenityScore,
        // New fields (will be null if feature flag off)
        ...(isFeatureEnabled('PGSI_INTEGRATION') && {
          pgsi_score: results.pgsiScore,
          risk_level: results.riskLevel,
          emotional_stability: results.emotionalStability,
          archetype: results.archetype.name
        }),
        created_at: new Date().toISOString()
      });

    if (saveError) {
      console.error('Error saving survey:', saveError);
      throw saveError;
    }

    // Update user_profiles table for authenticated users
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

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't throw - non-critical
      }
    }

    return results;
  }

  /**
   * Calculate unified scores from survey responses
   */
  private calculateUnifiedScores(responses: SurveyAnswer[]): UnifiedSurveyResult {
    let serenityTotal = 0;
    let maxSerenityPossible = 0;
    let pgsiTotal = 0;
    
    responses.forEach(response => {
      const question = ENHANCED_SURVEY_QUESTIONS.find(q => q.id === response.questionId);
      if (!question) return;
      
      const answerIndex = question.options.indexOf(response.selectedOption);
      if (answerIndex === -1) return;
      
      // Serenity score (using weights)
      if (question.category !== 'pgsi') {
        serenityTotal += question.weight[answerIndex];
        maxSerenityPossible += Math.max(...question.weight);
      }
      
      // PGSI score (using pgsiWeight)
      if (question.category !== 'serenity') {
        pgsiTotal += question.pgsiWeight[answerIndex];
      }
    });
    
    // Normalize Serenity to 0-100
    const serenityScore = maxSerenityPossible > 0 
      ? Math.min(100, Math.round((serenityTotal / maxSerenityPossible) * 100))
      : 0;
    
    // Calculate emotional stability (combination of both)
    const emotionalStability = this.calculateEmotionalStability(serenityScore, pgsiTotal);
    
    // Get archetype from existing function
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

  /**
   * Calculate emotional stability (60% Serenity, 40% inverse PGSI)
   */
  private calculateEmotionalStability(serenity: number, pgsi: number): number {
    const pgsiImpact = Math.min(100, (pgsi / 27) * 100);
    return Math.round((serenity * 0.6) + ((100 - pgsiImpact) * 0.4));
  }

  /**
   * Map PGSI score to risk level
   */
  private getRiskLevel(pgsi: number): 'low' | 'moderate' | 'high' | 'problem' {
    if (pgsi === 0) return 'low';
    if (pgsi <= 4) return 'moderate';
    if (pgsi <= 7) return 'high';
    return 'problem';
  }

  /**
   * Map PGSI score to category string (matches risk-models.ts)
   */
  private getPGSICategory(pgsi: number): string {
    if (pgsi === 0) return 'NON_PROBLEM';
    if (pgsi <= 2) return 'LOW_RISK';
    if (pgsi <= 7) return 'MODERATE_RISK';
    return 'PROBLEM_GAMBLER';
  }

  /**
   * Validate that all questions are answered
   */
  private validateResponses(responses: SurveyAnswer[]): void {
    if (!responses || responses.length === 0) {
      throw new Error('No survey responses provided');
    }
    
    // Get required question IDs (excluding multi-select which can have multiple entries)
    const requiredIds = ENHANCED_SURVEY_QUESTIONS
      .filter(q => !q.multi)
      .map(q => q.id);
    
    const answeredIds = new Set(responses.map(r => r.questionId));
    const missing = requiredIds.filter(id => !answeredIds.has(id));
    
    if (missing.length > 0) {
      throw new Error(`Missing responses for questions: ${missing.join(', ')}`);
    }
  }

  /**
   * Check if user has already taken survey today (rate limiting)
   */
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

    if (error) {
      console.error('Error checking survey status:', error);
      return false;
    }

    return data && data.length > 0;
  }
}

// Export singleton instance
export const surveyService = new SurveyService();