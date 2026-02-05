'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, Clipboard, FileText, Zap, Info } from 'lucide-react';
import { getPopularSports, mapTiltLabSportToConfig } from '@/lib/sports-config';

export interface BetData {
  league: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  odds: number;
  stake: number;
  result: 'win' | 'loss' | 'pending';
  sportsbook: string;
  confidenceLevel: number;
  gameDate?: Date;
  notes?: string;
}

interface TiltLabBetInputProps {
  onBetSubmit: (betData: BetData) => void;
  initialData?: Partial<BetData>;
}

const SPORTSBOOKS = [
  'DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 'BetRivers', 'Other'
];

// Enhanced sport mapping for better parsing
const SPORT_KEYWORDS = {
  'NFL': ['nfl', 'football', 'super bowl', 'afc', 'nfc'],
  'NBA': ['nba', 'basketball', 'playoffs', 'eastern', 'western'],
  'MLB': ['mlb', 'baseball', 'world series', 'al', 'nl'],
  'NHL': ['nhl', 'hockey', 'stanley cup'],
  'Soccer': ['soccer', 'football', 'premier league', 'epl', 'mls', 'champions league', 'la liga', 'bundesliga', 'serie a'],
  'College Football': ['college football', 'ncaaf', 'college', 'ncaa football'],
  'College Basketball': ['college basketball', 'ncaab', 'march madness', 'ncaa basketball'],
  'UFC': ['ufc', 'mma', 'fight', 'cage'],
  'Tennis': ['tennis', 'wimbledon', 'us open', 'french open', 'australian open'],
  'Golf': ['golf', 'pga', 'masters', 'open championship', 'us open golf'],
  'F1': ['f1', 'formula 1', 'grand prix'],
  'NASCAR': ['nascar', 'cup series', 'daytona'],
  'Boxing': ['boxing', 'fight', 'knockout'],
  'LoL': ['league of legends', 'lol', 'lcs', 'worlds'],
  'CS:GO': ['csgo', 'counter strike', 'major']
};

const MARKETS = [
  'Moneyline', 'Spread', 'Over/Under', 'Player Prop', 'Team Prop', 'Parlay', 'Other'
];

const RESULTS = [
  { value: 'loss', label: 'Lost' },
  { value: 'win', label: 'Won' },
  { value: 'pending', label: 'Pending' }
];

export function TiltLabBetInput({ onBetSubmit, initialData }: TiltLabBetInputProps) {
  const [inputMode, setInputMode] = useState<'manual' | 'paste'>('manual');
  const [formData, setFormData] = useState<Partial<BetData>>({
    league: '',
    homeTeam: '',
    awayTeam: '',
    market: '',
    odds: 0,
    stake: 0,
    result: 'loss',
    sportsbook: '',
    confidenceLevel: 75,
    notes: '',
    ...initialData
  });
  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState('');

  // Get available sports dynamically
  const availableSports = getPopularSports();

  const handleManualSubmit = useCallback(() => {
    if (!formData.league || !formData.homeTeam || !formData.awayTeam ||
      !formData.market || !formData.odds || !formData.stake || !formData.sportsbook) {
      setParseError('Please fill in all required fields');
      return;
    }

    const betData: BetData = {
      league: formData.league!,
      homeTeam: formData.homeTeam!,
      awayTeam: formData.awayTeam!,
      market: formData.market!,
      odds: formData.odds!,
      stake: formData.stake!,
      result: formData.result as 'win' | 'loss' | 'pending',
      sportsbook: formData.sportsbook!,
      confidenceLevel: formData.confidenceLevel || 75,
      notes: formData.notes,
      gameDate: new Date()
    };

    onBetSubmit(betData);
  }, [formData, onBetSubmit]);

  const parsePasteText = useCallback(() => {
    setParseError('');

    if (!pasteText.trim()) {
      setParseError('Please paste your bet information');
      return;
    }

    const text = pasteText.toLowerCase();

    // Try to extract odds (American format like -110, +150)
    const oddsMatch = text.match(/([+-]\d+)/);
    const odds = oddsMatch ? parseInt(oddsMatch[1]) : 0;

    // Try to extract stake (numbers with $ or just numbers)
    const stakeMatch = text.match(/\$(\d+)|(\d+)\s*(?:dollars?|bucks?)/i);
    const stake = stakeMatch ? parseInt(stakeMatch[1] || stakeMatch[2]) : 0;

    // Enhanced league identification with keyword matching
    let league = 'Other';
    for (const [sportName, keywords] of Object.entries(SPORT_KEYWORDS)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        league = sportName;
        break;
      }
    }

    // Map to sport config if possible
    const sportConfig = mapTiltLabSportToConfig(league);
    if (sportConfig && sportConfig.id !== league) {
      league = sportConfig.name; // Use the standardized name
    }

    // Try to identify sportsbook
    let sportsbook = 'Other';
    if (text.includes('draftkings') || text.includes('dk')) sportsbook = 'DraftKings';
    else if (text.includes('fanduel') || text.includes('fd')) sportsbook = 'FanDuel';
    else if (text.includes('betmgm') || text.includes('mgm')) sportsbook = 'BetMGM';

    // Try to identify market
    let market = 'Other';
    if (text.includes('spread') || text.includes('handicap')) market = 'Spread';
    else if (text.includes('over') || text.includes('under') || text.includes('total')) market = 'Over/Under';
    else if (text.includes('moneyline') || text.includes('ml')) market = 'Moneyline';

    // Extract teams (supports team names with special chars like O'Neill, St. Louis, etc.)
    const teamPattern = /([\w'.]+(?:\s+[\w'.]+)*)\s+(?:vs\.?|at|@|-)\s+([\w'.]+(?:\s+[\w'.]+)*)/i;
    const teamMatch = text.match(teamPattern);
    const homeTeam = teamMatch?.[2]?.trim() || ''; // Team after "vs/at" is typically home
    const awayTeam = teamMatch?.[1]?.trim() || ''; // Team before "vs/at" is typically away

    const parsedData: Partial<BetData> = {
      league,
      homeTeam,
      awayTeam,
      market,
      odds,
      stake,
      sportsbook,
      confidenceLevel: 75,
      result: 'loss', // Default to loss for TiltLab
      notes: `Parsed from: ${pasteText.substring(0, 100)}...`
    };

    setFormData(parsedData);
    setInputMode('manual');
  }, [pasteText]);

  const updateFormData = useCallback((field: keyof BetData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bet Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={inputMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setInputMode('manual')}
              size="sm"
            >
              Manual Entry
            </Button>
            <Button
              variant={inputMode === 'paste' ? 'default' : 'outline'}
              onClick={() => setInputMode('paste')}
              size="sm"
            >
              <Clipboard className="h-4 w-4 mr-1" />
              Paste & Parse
            </Button>
          </div>

          {inputMode === 'paste' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="paste-text">Paste your bet information</Label>
                <Textarea
                  id="paste-text"
                  placeholder="Paste your bet slip text here... Example: 'NFL - Chiefs vs Broncos -7 (-110) $110 to win $100'"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {parseError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {parseError}
                </div>
              )}

              <Button onClick={parsePasteText} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Parse Bet Information
              </Button>

              <div className="text-xs text-muted-foreground">
                This will attempt to extract teams, odds, stake, and other details from your text.
                You can review and edit the parsed information in manual mode.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* League */}
              <div>
                <Label htmlFor="league">League *</Label>
                <Select value={formData.league} onValueChange={(value) => updateFormData('league', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select league" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSports.map(sport => (
                      <SelectItem key={sport.id} value={sport.name}>
                        {sport.icon} {sport.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">🏷️ Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Teams */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="home-team">Home Team *</Label>
                  <Input
                    id="home-team"
                    placeholder="e.g., Chiefs"
                    value={formData.homeTeam || ''}
                    onChange={(e) => updateFormData('homeTeam', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="away-team">Away Team *</Label>
                  <Input
                    id="away-team"
                    placeholder="e.g., Broncos"
                    value={formData.awayTeam || ''}
                    onChange={(e) => updateFormData('awayTeam', e.target.value)}
                  />
                </div>
              </div>

              {/* Market */}
              <div>
                <Label htmlFor="market">Market Type *</Label>
                <Select value={formData.market} onValueChange={(value) => updateFormData('market', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETS.map(market => (
                      <SelectItem key={market} value={market}>{market}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Odds and Stake */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="odds">Odds (American) *</Label>
                  <Input
                    id="odds"
                    type="number"
                    placeholder="e.g., -110"
                    value={formData.odds || ''}
                    onChange={(e) => updateFormData('odds', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="stake">Stake ($) *</Label>
                  <Input
                    id="stake"
                    type="number"
                    placeholder="e.g., 110"
                    value={formData.stake || ''}
                    onChange={(e) => updateFormData('stake', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Sportsbook */}
              <div>
                <Label htmlFor="sportsbook">Sportsbook *</Label>
                <Select value={formData.sportsbook} onValueChange={(value) => updateFormData('sportsbook', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sportsbook" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTSBOOKS.map(book => (
                      <SelectItem key={book} value={book}>{book}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Confidence */}
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidence" className="flex items-center gap-1.5">
                    How confident are you?
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </Label>
                  <span className="text-sm font-medium">{formData.confidenceLevel}%</span>
                </div>
                <Slider
                  id="confidence"
                  min={0}
                  max={100}
                  step={5}
                  value={[formData.confidenceLevel || 75]}
                  onValueChange={(value) => updateFormData('confidenceLevel', value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Hesitant</span>
                  <span>Neutral</span>
                  <span>Extremely Confident</span>
                </div>
              </div>

              {/* Result */}
              <div>
                <Label>Result *</Label>
                <RadioGroup
                  value={formData.result}
                  onValueChange={(value) => updateFormData('result', value)}
                  className="flex gap-4"
                >
                  {RESULTS.map(result => (
                    <div key={result.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={result.value} id={result.value} />
                      <Label htmlFor={result.value}>{result.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional context..."
                  value={formData.notes || ''}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {parseError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {parseError}
                </div>
              )}

              <Button onClick={handleManualSubmit} className="w-full">
                Continue to Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TiltLabBetInput;
