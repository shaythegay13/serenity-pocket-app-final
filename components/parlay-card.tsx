import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, Target, Heart } from "lucide-react"
import type { ParlayRecommendation } from "@/lib/types/ai-models"

interface ParlayCardProps {
    parlay: ParlayRecommendation
    onAnalyze: (parlay: ParlayRecommendation) => void
    onEmotionCheckIn: (parlay: ParlayRecommendation) => void
}

export function ParlayCard({ parlay, onAnalyze, onEmotionCheckIn }: ParlayCardProps) {
    const isHighValue = parlay.evPercentage > 10
    const isSGP = parlay.parlayType === 'sgp'
    const hasCorrelations = parlay.correlationWarnings && parlay.correlationWarnings.length > 0

    return (
        <Card className={`p-0 overflow-hidden ${isSGP ? 'border-blue-500/30 hover:border-blue-500/50' : 'border-purple-500/30 hover:border-purple-500/50'} bg-background/50 transition-colors`}>
            {/* Header */}
            <div className={`p-4 ${isSGP ? 'bg-linear-to-r from-blue-500/10 to-cyan-500/10 border-b border-blue-500/10' : 'bg-linear-to-r from-purple-500/10 to-blue-500/10 border-b border-purple-500/10'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={isSGP ? "border-blue-500 text-blue-500" : "border-purple-500 text-purple-500"}>
                            {isSGP ? 'SGP' : `${parlay.legs.length}-Leg`}
                        </Badge>
                        {hasCorrelations && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Correlated
                            </Badge>
                        )}
                    </div>
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
                {parlay.legs.map((leg, idx) => {
                    const isPlayerProp = Boolean(leg.playerName && leg.propStat)
                    return (
                        <div key={idx} className={`flex items-center justify-between text-sm p-2 rounded-lg ${isPlayerProp ? 'bg-blue-500/10' : 'bg-secondary/20'}`}>
                            <div>
                                {isPlayerProp ? (
                                    <>
                                        <p className="font-medium text-foreground">{leg.playerName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {leg.propDirection === 'over' ? 'Over' : 'Under'} {leg.propLine} {leg.line?.split(' ').slice(-1)[0] || ''}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium text-foreground">{leg.teams}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {leg.betType === 'moneyline' ? 'Moneyline' :
                                                leg.betType === 'spread' ? `Spread ${leg.line}` :
                                                    leg.betType === 'total' ? `Total ${leg.line}` : leg.betType}
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="text-right flex items-center gap-2">
                                {isPlayerProp && (
                                    <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-500">
                                        Prop
                                    </Badge>
                                )}
                                <span className="font-mono text-xs bg-background/50 px-2 py-1 rounded">
                                    {leg.odds > 0 ? '+' : ''}{leg.odds}
                                </span>
                            </div>
                        </div>
                    )
                })}
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
                    Analyze this Bet
                </Button>
                <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEmotionCheckIn(parlay)}
                >
                    <Heart className="h-4 w-4 mr-2" />
                    Emotional Check In
                </Button>
            </div>
        </Card>
    )
}
