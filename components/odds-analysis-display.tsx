import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type OddsAnalysis } from "@/lib/odds-calculator"
import { TrendingUp, TrendingDown, Minus, Calculator, Info } from "lucide-react"

interface OddsAnalysisDisplayProps {
  analysis: OddsAnalysis | null
}

export function OddsAnalysisDisplay({ analysis }: OddsAnalysisDisplayProps) {
  if (!analysis) return null

  const getMarketTypeColor = (type: string) => {
    switch (type) {
      case 'balanced': return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'favorite-heavy': return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'underdog-heavy': return 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'promotional': return 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-800'
      default: return 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    }
  }

  const getOddsPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'mixed': return 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-800'
      case 'both-negative': return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'both-positive': return 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800'
      default: return 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    }
  }

  const getValueColor = (value: number) => {
    if (value > 2) return 'text-green-600 dark:text-green-400'
    if (value < -2) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const formatOdds = (odds: number) => {
    if (!odds || Number.isNaN(odds)) return 'N/A'
    return odds > 0 ? `+${odds}` : `${odds}`
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Odds Analysis</h3>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Teams and Odds */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">{analysis.homeTeam}</p>
                <p className="text-xs text-muted-foreground">Home</p>
                {analysis.favoriteTeam === analysis.homeTeam && (
                  <Badge className="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-800 text-xs mt-1">
                    Favorite
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-foreground">{formatOdds(analysis.homeOdds)}</p>
                <p className="text-xs text-muted-foreground">{analysis.homeImpliedProb.toFixed(1)}% implied</p>
                <p className="text-xs text-primary font-medium">{analysis.homeTrueProb.toFixed(1)}% true</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">{analysis.awayTeam}</p>
                <p className="text-xs text-muted-foreground">Away</p>
                {analysis.favoriteTeam === analysis.awayTeam && (
                  <Badge className="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-800 text-xs mt-1">
                    Favorite
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-foreground">{formatOdds(analysis.awayOdds)}</p>
                <p className="text-xs text-muted-foreground">{analysis.awayImpliedProb.toFixed(1)}% implied</p>
                <p className="text-xs text-primary font-medium">{analysis.awayTrueProb.toFixed(1)}% true</p>
              </div>
            </div>
          </div>

          {/* Market Analysis */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-background rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">Market Type:</span>
              <Badge className={getMarketTypeColor(analysis.marketType)}>
                {analysis.marketType.replace('-', ' ')}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-background rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">Odds Pattern:</span>
              <Badge className={getOddsPatternColor(analysis.oddsPattern)}>
                {analysis.oddsPattern.replace('-', ' ')}
              </Badge>
            </div>

            <div className="flex justify-between items-center p-2 bg-background rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">Bookmaker Edge:</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {analysis.bookmakerEdge.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center p-2 bg-background rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">Total Implied:</span>
              <span className="text-sm font-medium text-foreground">
                {analysis.totalImpliedProb.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Favorite/Underdog Identification */}
        <div className="mt-4 p-3 bg-background rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-foreground">Favorite:</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{analysis.favoriteTeam}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-foreground">Underdog:</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{analysis.underdogTeam}</span>
            </div>
          </div>
        </div>

        {/* True Probabilities vs Implied */}
        <div className="mt-4 p-3 bg-background rounded-lg border border-border">
          <p className="text-sm font-medium mb-3 text-foreground">True Probabilities (Vig Removed)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{analysis.homeTeam}</p>
              <p className="text-sm font-medium text-foreground">{analysis.homeTrueProb.toFixed(1)}%</p>
              <p className={`text-xs font-medium ${getValueColor(analysis.homeValue)}`}>
                {analysis.homeValue > 0 ? '+' : ''}{analysis.homeValue.toFixed(1)}% value
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{analysis.awayTeam}</p>
              <p className="text-sm font-medium text-foreground">{analysis.awayTrueProb.toFixed(1)}%</p>
              <p className={`text-xs font-medium ${getValueColor(analysis.awayValue)}`}>
                {analysis.awayValue > 0 ? '+' : ''}{analysis.awayValue.toFixed(1)}% value
              </p>
            </div>
          </div>
        </div>

        {/* Educational Note */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Understanding the Analysis:</p>
              <p>The bookmaker's edge (vig) is built into the odds. True probabilities remove this edge to show actual chances. Positive value indicates potential betting value based on true probability vs implied probability.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
