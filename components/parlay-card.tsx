import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, Wallet, Target, Heart } from "lucide-react"
import type { ParlayRecommendation } from "@/lib/types/ai-models"

interface ParlayCardProps {
    parlay: ParlayRecommendation
    onAnalyze: (parlay: ParlayRecommendation) => void
    onLogBet: (parlay: ParlayRecommendation) => void
    onEmotionCheckIn?: (parlay: ParlayRecommendation) => void
}

export function ParlayCard({ parlay, onAnalyze, onLogBet, onEmotionCheckIn }: ParlayCardProps) {
    const isHighValue = parlay.evPercentage > 10

    return (
        <Card className="p-0 overflow-hidden border-purple-500/30 bg-background/50 hover:border-purple-500/50 transition-colors">
            {/* Header */}
            <div className="p-4 bg-linear-to-r from-purple-500/10 to-blue-500/10 border-b border-purple-500/10">
                <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="border-purple-500 text-purple-500">
                        {parlay.legs.length}-Leg Parlay
                    </Badge>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-500">
                            +{parlay.evPercentage.toFixed(1)}% EV
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-bold">
                            +{parlay.totalOddsAmerican}
                        </p>
                        <p className="text-xs text-muted-foreground">Combined Odds</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="font-bold text-amber-500">
                                {(parlay.trueProbability * 100).toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Win Probability</p>
                    </div>
                </div>
            </div>

            {/* Legs */}
            <div className="p-4 space-y-3">
                {parlay.legs.map((leg, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/20">
                        <div>
                            <p className="font-medium text-foreground">{leg.teams}</p>
                            <p className="text-xs text-muted-foreground">
                                {leg.betType === 'moneyline' ? 'Moneyline' :
                                    leg.betType === 'spread' ? `Spread ${leg.line}` :
                                        leg.betType === 'total' ? `Total ${leg.line}` : leg.betType}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="font-mono text-xs bg-background/50 px-2 py-1 rounded">
                                {leg.odds > 0 ? '+' : ''}{leg.odds}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-secondary/5 flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onAnalyze(parlay)}
                >
                    <Target className="h-4 w-4 mr-2" />
                    Analyze
                </Button>
                {onEmotionCheckIn && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onEmotionCheckIn(parlay)}
                    >
                        <Heart className="h-4 w-4 mr-2" />
                        Emotion
                    </Button>
                )}
                <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => onLogBet(parlay)}
                >
                    <Wallet className="h-4 w-4 mr-2" />
                    Build Slip
                </Button>
            </div>
        </Card>
    )
}
