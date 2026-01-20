'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Clock, 
  Target,
  Shield,
  Zap,
  ChevronRight
} from 'lucide-react';
import { getPopularSports } from '@/lib/sports-config';

export interface GameCard {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: Date;
  ev: number; // Expected Value percentage
  psychAlignment: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  stakeRange: {
    min: number;
    max: number;
    recommended: number;
  };
  confidence: number;
  market: string;
  odds: number;
  deepLink: string; // DraftKings deep link
}

interface SmartSlipGameListProps {
  league: string;
  aggression: 'Conservative' | 'Moderate' | 'Aggressive';
  onComplete: () => void;
  onBack?: () => void;
}

// Mock data - in production this would come from an API
const generateMockGames = (league: string, aggression: string): GameCard[] => {
  const baseGames = [
    {
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      gameTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      market: 'Spread',
      odds: -110
    },
    {
      homeTeam: 'Dallas Cowboys',
      awayTeam: 'Philadelphia Eagles',
      gameTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      market: 'Moneyline',
      odds: +125
    },
    {
      homeTeam: 'Green Bay Packers',
      awayTeam: 'Detroit Lions',
      gameTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      market: 'Over/Under',
      odds: -105
    }
  ];

  const aggressionMultipliers = {
    Conservative: { ev: 0.8, stake: 0.7 },
    Moderate: { ev: 1.0, stake: 1.0 },
    Aggressive: { ev: 1.2, stake: 1.5 }
  };

  const multiplier = aggressionMultipliers[aggression as keyof typeof aggressionMultipliers];

  return baseGames.map((game, index) => ({
    id: `${league}-${index}`,
    league,
    ...game,
    ev: Math.round((Math.random() * 10 - 5) * multiplier.ev * 10) / 10, // -5% to +5% EV
    psychAlignment: ['Excellent', 'Good', 'Fair', 'Poor'][Math.floor(Math.random() * 4)] as GameCard['psychAlignment'],
    stakeRange: {
      min: Math.round(10 * multiplier.stake),
      max: Math.round(100 * multiplier.stake),
      recommended: Math.round(25 * multiplier.stake)
    },
    confidence: Math.round((60 + Math.random() * 35) * multiplier.ev), // 60-95% confidence
    deepLink: `https://sportsbook.draftkings.com/event/${game.homeTeam.replace(/\s+/g, '-').toLowerCase()}-vs-${game.awayTeam.replace(/\s+/g, '-').toLowerCase()}`
  }));
};

export function SmartSlipGameList({ league, aggression, onComplete, onBack }: SmartSlipGameListProps) {
  const [games, setGames] = useState<GameCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState(league);
  const [selectedAggression, setSelectedAggression] = useState(aggression);

  // Get available sports dynamically
  const availableSports = getPopularSports();

  useEffect(() => {
    // Simulate API call
    const loadGames = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      const mockGames = generateMockGames(selectedLeague, selectedAggression);
      setGames(mockGames);
      setLoading(false);
    };

    loadGames();
  }, [selectedLeague, selectedAggression]);

  const getEVColor = (ev: number) => {
    if (ev > 3) return 'text-green-600';
    if (ev > 0) return 'text-green-500';
    if (ev > -3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPsychAlignmentColor = (alignment: GameCard['psychAlignment']) => {
    switch (alignment) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Fair': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Poor': return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatGameTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `In ${hours}h ${minutes}m`;
    }
    return `In ${minutes}m`;
  };

  const handlePlaceBet = (deepLink: string) => {
    window.open(deepLink, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Finding Your Games</h3>
              <p className="text-muted-foreground">
                Analyzing {selectedLeague} games for {selectedAggression.toLowerCase()} strategy...
              </p>
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
            <Target className="h-6 w-6" />
            Smart Slip Game List
          </CardTitle>
          <p className="text-muted-foreground">
            AI-curated games matching your {selectedAggression.toLowerCase()} strategy
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4 p-4 bg-muted/50 rounded-lg justify-end">
            <div className="flex-1">
              <div className="flex flex-col items-center space-y-2">
                <Select value={selectedLeague} onValueChange={(value: string) => setSelectedLeague(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.icon} {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm font-medium">Sport</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col items-center space-y-2">
                <Select value={selectedAggression} onValueChange={(value: "Conservative" | "Moderate" | "Aggressive") => setSelectedAggression(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conservative">Conservative</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm font-medium">Risk Tolerance</span>
              </div>
            </div>
          </div>

          {/* Game Cards */}
          <div className="space-y-4">
            {games.map((game) => (
              <Card key={game.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{game.league}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatGameTime(game.gameTime)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-1">
                        {game.homeTeam} vs {game.awayTeam}
                      </h3>
                      <p className="text-sm text-muted-foreground">{game.market}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getEVColor(game.ev)}`}>
                        {game.ev > 0 ? '+' : ''}{game.ev}%
                      </div>
                      <p className="text-xs text-muted-foreground">EV</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {/* Psych Alignment */}
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Psych Alignment</div>
                      <Badge className={getPsychAlignmentColor(game.psychAlignment)}>
                        {game.psychAlignment}
                      </Badge>
                    </div>

                    {/* Confidence */}
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getConfidenceColor(game.confidence)}`} />
                        <span className="font-medium">{game.confidence}%</span>
                      </div>
                    </div>

                    {/* Stake Range */}
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Stake Range</div>
                      <div className="text-sm">
                        ${game.stakeRange.min} - ${game.stakeRange.max}
                      </div>
                      <div className="text-xs text-primary font-medium">
                        Rec: ${game.stakeRange.recommended}
                      </div>
                    </div>

                    {/* Odds */}
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Odds</div>
                      <div className="text-lg font-medium">
                        {game.odds > 0 ? '+' : ''}{game.odds}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handlePlaceBet(game.deepLink)}
                      className="flex-1"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Place Bet
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Hold Off
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Games Analyzed</span>
              <span className="text-sm">{games.length} games</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Average EV</span>
              <span className="text-sm font-medium">
                {(games.reduce((sum, g) => sum + g.ev, 0) / games.length).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Strategy Fit</span>
              <Badge variant="secondary">{selectedAggression}</Badge>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button onClick={onComplete} className="ml-auto">
              Complete Smart Slip
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SmartSlipGameList;
