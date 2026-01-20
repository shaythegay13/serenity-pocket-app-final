'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  ChevronRight,
  Loader2,
  Target,
  Shield,
  Zap
} from 'lucide-react';
import { analyzeScenarioWithAI, BetScenario, AIEnhancedAnalysis } from '@/lib/ai-bet-advisor';
import { BetData } from './TiltLabBetInput';
import { EmotionDriver } from './TiltLabEmotionDriverCheckIn';

interface TiltLabAnalysisViewProps {
  betData: BetData;
  emotionDrivers: EmotionDriver[];
  onComplete: () => void;
  onBack?: () => void;
}

export function TiltLabAnalysisView({ 
  betData, 
  emotionDrivers, 
  onComplete, 
  onBack 
}: TiltLabAnalysisViewProps) {
  const [analysis, setAnalysis] = useState<AIEnhancedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert bet data to BetScenario format for AI analysis
  const createBetScenario = useCallback((): BetScenario => {
    // Determine sport from league
    let sport: any = 'other';
    const league = betData.league.toLowerCase();
    if (league.includes('nfl') || league.includes('football')) sport = 'football';
    else if (league.includes('nba') || league.includes('basketball')) sport = 'basketball';
    else if (league.includes('mlb') || league.includes('baseball')) sport = 'baseball';
    else if (league.includes('nhl') || league.includes('hockey')) sport = 'hockey';

    // Determine primary emotion and intensity
    const primaryEmotion = emotionDrivers.length > 0 ? emotionDrivers[0] : null;
    const emotionText = emotionDrivers.map(e => e.emotion).join(', ') || 'None identified';

    return {
      // Core bet details
      sport,
      homeTeam: betData.homeTeam,
      awayTeam: betData.awayTeam,
      gameDate: betData.gameDate || new Date(),
      betType: betData.market.includes('Spread') ? 'Spread' : 
               betData.market.includes('Over') || betData.market.includes('Under') ? 'Over/Under' : 
               'Moneyline',
      selection: 'home', // Default - could be enhanced with parsing
      line: betData.market.includes('Spread') ? -7 : undefined, // Default spread
      odds: betData.odds,
      betAmount: betData.stake,
      budget: 1000, // Default budget - could be enhanced
      
      // Legacy fields (for compatibility)
      favoriteTeam: betData.homeTeam,
      underdogTeam: betData.awayTeam,
      favoriteRecord: 'Unknown',
      underdogRecord: 'Unknown',
      injuries: 'Unknown',
      weather: 'Unknown',
      
      // Boolean fields
      hasKeyInjuries: false,
      hasAdverseWeather: false,
      isLiveBet: false,
      isFavoriteTeam: false,
      isChasingLoss: betData.result === 'loss',
      
      // Emotional data
      currentEmotion: primaryEmotion?.emotion || 'Unknown',
      currentEmotionIntensity: primaryEmotion?.intensity || 5,
      lastOutcome: betData.result === 'win' ? 'Won' : betData.result === 'loss' ? 'Lost' : 'None',
      emotionalTriggers: emotionText,
      bettingSlip: `${betData.league}: ${betData.homeTeam} vs ${betData.awayTeam}`,
      history: 'Recent loss detected',
      notes: betData.notes || ''
    };
  }, [betData, emotionDrivers]);

  // Run AI analysis when component mounts
  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        const scenario = createBetScenario();
        const result = await analyzeScenarioWithAI(scenario);
        setAnalysis(result);
      } catch (err) {
        console.error('Analysis failed:', err);
        setError('Analysis failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [createBetScenario]);

  const getEVColor = (ev: number) => {
    if (ev > 5) return 'text-green-600';
    if (ev > 0) return 'text-green-500';
    if (ev > -5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Analyzing Your Bet</h3>
              <p className="text-muted-foreground">
                Running AI analysis on emotional drivers and bet quality...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="text-center py-12 space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Analysis Failed</h3>
              <p className="text-muted-foreground">{error || 'Unknown error occurred'}</p>
            </div>
            <div className="flex gap-2 justify-center">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  Back
                </Button>
              )}
              <Button onClick={onComplete}>
                Continue Anyway
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Brain className="h-6 w-6" />
            Tilt Lab Analysis
          </CardTitle>
          <p className="text-muted-foreground">
            AI-powered insights on your recent bet and emotional state
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Bet Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Bet Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">League:</span>
                <div className="font-medium">{betData.league}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Match:</span>
                <div className="font-medium">{betData.homeTeam} vs {betData.awayTeam}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Market:</span>
                <div className="font-medium">{betData.market}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Result:</span>
                <div className="font-medium capitalize">{betData.result}</div>
              </div>
            </div>
          </div>

          {/* Emotional Drivers */}
          {emotionDrivers.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Emotional Drivers
              </h4>
              <div className="flex flex-wrap gap-2">
                {emotionDrivers.map((driver, index) => (
                  <Badge key={index} variant="secondary">
                    {driver.emotion} ({driver.intensity}/10)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Technical Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Technical Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recommendation</span>
                  <Badge variant={analysis.recommendation.recommendation === 'PLACE BET' ? 'default' : 'secondary'}>
                    {analysis.recommendation.recommendation}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Confidence</span>
                    <span>{analysis.recommendation.confidence}%</span>
                  </div>
                  <Progress value={analysis.recommendation.confidence} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Risk Level</span>
                    <Badge variant={analysis.recommendation.riskLevel === 'HIGH' ? 'destructive' : 'secondary'}>
                      {analysis.recommendation.riskLevel}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Key Factors:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Risk Level: {analysis.recommendation.riskLevel}</li>
                    <li>• Budget Impact: {analysis.recommendation.budgetPercent}% of weekly budget</li>
                    <li>• Safety Score: {analysis.safety.percent}%</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Emotional Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Emotional Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Emotional Risk</span>
                  <Badge variant={analysis.recommendation.emotionalAnalysis.emotionalRisk === 'HIGH' ? "destructive" : "secondary"}>
                    {analysis.recommendation.emotionalAnalysis.emotionalRisk}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Emotional Insights:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Emotional state: {analysis.recommendation.emotionalAnalysis.emotionalState}</li>
                    <li>• Should wait: {analysis.recommendation.emotionalAnalysis.shouldWait ? 'Yes' : 'No'}</li>
                    <li>• Waiting period: {analysis.recommendation.emotionalAnalysis.waitingPeriod}</li>
                  </ul>
                </div>

                {analysis.recommendation.emotionalAnalysis.shouldWait && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      <strong>Recommendation:</strong> {analysis.recommendation.emotionalAnalysis.waitingPeriod} 
                      waiting period suggested before betting.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    analysis.recommendation.recommendation === 'PLACE BET' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">AI Recommendation:</p>
                    <p className="text-sm text-muted-foreground">
                      {analysis.recommendation.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    analysis.recommendation.emotionalAnalysis.shouldWait ? 'bg-orange-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">Emotional Management:</p>
                    <p className="text-sm text-muted-foreground">
                      {analysis.recommendation.emotionalAnalysis.shouldWait
                        ? `Take ${analysis.recommendation.emotionalAnalysis.waitingPeriod} off betting.`
                        : 'Emotional state appears stable for betting.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Strategy Adjustment:</p>
                    <p className="text-sm text-muted-foreground">
                      Consider reducing stake sizes by 25% for the next week to rebuild confidence.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button onClick={onComplete} className="ml-auto">
              Complete Analysis
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TiltLabAnalysisView;
