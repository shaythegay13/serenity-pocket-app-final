"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Target, AlertTriangle, TrendingUp, Lock, Sparkles, Save, Check, Brain } from "lucide-react"
import type { UserData, BetAnalysis } from "@/lib/types"
import { canAccessFeature, getUpgradeMessage } from "@/lib/subscription-tiers"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"
import { useEmotionalStability } from "@/lib/hooks/use-emotional-stability"
import { FeatureGate } from "@/components/feature-gate"
import { BetTrackingService } from "@/lib/bet-tracking-service"

interface AnalyzeBetTabProps {
  userData: UserData
  onNavigateToTab: (tab: string) => void
}

export function AnalyzeBetTab({ userData, onNavigateToTab }: AnalyzeBetTabProps) {
  const [betDescription, setBetDescription] = useState("")
  const [stake, setStake] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasAccess = canAccessFeature(userData.subscriptionTier || "free", "ai_bet_analyzer")
  const { isStable, stabilityScore, factors } = useEmotionalStability()

  const handleAnalyze = async () => {
    if (!betDescription.trim() || !stake.trim()) {
      toast.error("Please enter both bet description and stake amount")
      return
    }

    setAnalyzing(true)
    setAnalysis(null)

    try {
      const response = await fetch("/api/ai/analyze-bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: betDescription,
          stake: parseFloat(stake),
          emotionalStability: stabilityScore,
          stabilityFactors: factors
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setAnalysis(result.data)
        setSaved(false)
      } else {
        toast.error(result.error || "Analysis failed")
      }
    } catch (error) {
      console.error("Analysis error:", error)
      toast.error("Failed to analyze bet")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!analysis) return

    setSaving(true)
    try {
      const betAnalysis: BetAnalysis = {
        id: `analysis_${Date.now()}`,
        timestamp: new Date(),
        betType: "straight",
        description: betDescription,
        stake: parseFloat(stake),
        emotionalState: analysis.emotionalState || "neutral",
        emotionalIntensity: analysis.emotionalIntensity || 5,
        biasWarnings: analysis.biasWarnings || [],
        aiRecommendation: analysis.recommendation,
        expectedValue: analysis.expectedValue,
        probabilityEstimate: analysis.probability,
        outcome: "pending",
        status: "pending"
      }

      await BetTrackingService.saveBetAnalysis(betAnalysis)
      setSaved(true)
      toast.success("Analysis saved successfully")
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Failed to save analysis")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setBetDescription("")
    setStake("")
    setAnalysis(null)
    setSaved(false)
  }

  // Non‑premium: show upgrade gate
  if (!hasAccess) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">AI Bet Analyzer</h2>
          <p className="text-muted-foreground">
            Get AI-powered insights and bias detection for your betting decisions
          </p>
        </div>

        <Card className="p-12 text-center bg-linear-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-purple-500/20">
              <Brain className="h-12 w-12 text-purple-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Premium Feature</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {getUpgradeMessage(userData.subscriptionTier || "free", "AI Bet Analyzer")}
          </p>
          <Button size="lg" onClick={() => onNavigateToTab("account")}>
            Upgrade to Premium
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">AI Bet Analyzer</h2>
        <p className="text-muted-foreground">
          Get AI-powered insights and emotional bias detection for your betting decisions
        </p>
      </div>

      {/* Emotional Stability Indicator */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-purple-500" />
            <span className="font-medium">Emotional State</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isStable ? "default" : "destructive"}>
              {isStable ? "Stable" : "Unstable"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {stabilityScore}/100
            </span>
          </div>
        </div>
        {!isStable && factors.length > 0 && (
          <div className="mt-3 text-sm text-muted-foreground">
            Consider waiting: {factors.join(", ")}
          </div>
        )}
      </Card>

      {/* Input Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bet Description</label>
            <Textarea
              placeholder="Describe your bet (e.g., 'Lakers vs Celtics - moneyline')"
              value={betDescription}
              onChange={(e) => setBetDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Stake Amount ($)</label>
            <Input
              type="number"
              placeholder="100.00"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleAnalyze} 
              disabled={analyzing || !betDescription.trim() || !stake.trim()}
              className="flex-1"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Bet
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={handleReset}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">AI Analysis</h3>
              <Button 
                onClick={handleSave} 
                disabled={saving || saved}
                size="sm"
                variant={saved ? "secondary" : "default"}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Analysis
                  </>
                )}
              </Button>
            </div>

            {/* Recommendation */}
            {analysis.recommendation && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Recommendation</h4>
                    <p className="text-blue-800 dark:text-blue-200 mt-1">{analysis.recommendation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bias Warnings */}
            {analysis.biasWarnings && analysis.biasWarnings.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Bias Warnings</h4>
                    <ul className="text-yellow-800 dark:text-yellow-200 mt-1 space-y-1">
                      {analysis.biasWarnings.map((warning: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.expectedValue !== undefined && (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {analysis.expectedValue > 0 ? '+' : ''}{(analysis.expectedValue * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Expected Value</div>
                </div>
              )}
              
              {analysis.probability !== undefined && (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">
                    {(analysis.probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Win Probability</div>
                </div>
              )}
              
              {analysis.riskLevel && (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className={`text-2xl font-bold ${
                    analysis.riskLevel === 'low' ? 'text-green-500' :
                    analysis.riskLevel === 'medium' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {analysis.riskLevel}
                  </div>
                  <div className="text-sm text-muted-foreground">Risk Level</div>
                </div>
              )}
            </div>

            {/* Emotional Analysis */}
            {analysis.emotionalState && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Emotional Analysis</h4>
                <div className="text-purple-800 dark:text-purple-200">
                  <p>State: {analysis.emotionalState}</p>
                  {analysis.emotionalIntensity && (
                    <p>Intensity: {analysis.emotionalIntensity}/10</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
