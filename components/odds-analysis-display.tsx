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
      case 'balanced': return 'bg-blue-100 text-blue-800'
      case 'favorite-heavy': return 'bg-red-100 text-red-800'
      case 'underdog-heavy': return 'bg-green-100 text-green-800'
      case 'promotional': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOddsPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'mixed': return 'bg-orange-100 text-orange-800'
      case 'both-negative': return 'bg-red-100 text-red-800'
      case 'both-positive': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getValueColor = (value: number) => {
    if (value > 2) return 'text-green-600'
    if (value < -2) return 'text-red-600'
    return 'text-gray-600'
  }

  const formatOdds = (odds: number) => {
    if (!odds || Number.isNaN(odds)) return 'N/A'
    return odds > 0 ? `+${odds}` : `${odds}`
  }

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-blue-600" />
          <h4 className="font-semibold text-blue-900">Enhanced Odds Analysis</h4>
          <Info className="h-3 w-3 text-blue-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Teams and Odds */}
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-white rounded border">
              <div>
                <p className="font-medium text-sm">{analysis.homeTeam}</p>
                <p className="text-xs text-gray-500">Home</p>
                {analysis.favoriteTeam === analysis.homeTeam && (
                  <Badge className="bg-red-100 text-red-800 text-xs mt-1">Favorite</Badge>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{formatOdds(analysis.homeOdds)}</p>
                <p className="text-xs text-gray-500">{analysis.homeImpliedProb.toFixed(1)}% implied</p>
                <p className="text-xs text-blue-600">{analysis.homeTrueProb.toFixed(1)}% true</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-white rounded border">
              <div>
                <p className="font-medium text-sm">{analysis.awayTeam}</p>
                <p className="text-xs text-gray-500">Away</p>
                {analysis.favoriteTeam === analysis.awayTeam && (
                  <Badge className="bg-red-100 text-red-800 text-xs mt-1">Favorite</Badge>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{formatOdds(analysis.awayOdds)}</p>
                <p className="text-xs text-gray-500">{analysis.awayImpliedProb.toFixed(1)}% implied</p>
                <p className="text-xs text-blue-600">{analysis.awayTrueProb.toFixed(1)}% true</p>
              </div>
            </div>
          </div>

          {/* Market Analysis */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Market Type:</span>
              <Badge className={getMarketTypeColor(analysis.marketType)}>
                {analysis.marketType.replace('-', ' ')}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Odds Pattern:</span>
              <Badge className={getOddsPatternColor(analysis.oddsPattern)}>
                {analysis.oddsPattern.replace('-', ' ')}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bookmaker Edge:</span>
              <span className="text-sm font-medium text-red-600">
                {analysis.bookmakerEdge.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Implied:</span>
              <span className="text-sm font-medium">
                {analysis.totalImpliedProb.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Favorite/Underdog Identification */}
        <div className="mt-4 p-3 bg-white rounded border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Favorite:</span>
              <span className="text-sm font-bold text-red-600">{analysis.favoriteTeam}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Underdog:</span>
              <span className="text-sm font-bold text-green-600">{analysis.underdogTeam}</span>
            </div>
          </div>
        </div>

        {/* True Probabilities vs Implied */}
        <div className="mt-4 p-3 bg-white rounded border">
          <p className="text-sm font-medium mb-2">True Probabilities (Vig Removed)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">{analysis.homeTeam}</p>
              <p className="text-sm font-medium">{analysis.homeTrueProb.toFixed(1)}%</p>
              <p className={`text-xs ${getValueColor(analysis.homeValue)}`}>
                {analysis.homeValue > 0 ? '+' : ''}{analysis.homeValue.toFixed(1)}% value
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{analysis.awayTeam}</p>
              <p className="text-sm font-medium">{analysis.awayTrueProb.toFixed(1)}%</p>
              <p className={`text-xs ${getValueColor(analysis.awayValue)}`}>
                {analysis.awayValue > 0 ? '+' : ''}{analysis.awayValue.toFixed(1)}% value
              </p>
            </div>
          </div>
        </div>

        {/* Educational Note */}
        <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
          <Info className="h-3 w-3 inline mr-1" />
          <strong>Understanding the Analysis:</strong> The bookmaker's edge (vig) is built into the odds. 
          True probabilities remove this edge to show the actual chances. Positive value indicates 
          potential betting value based on true probability vs implied probability.
        </div>
      </CardContent>
    </Card>
  )
}
