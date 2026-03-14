
import {
  calculateWinReturn,
  computeEv,
  calculateBettingMetrics
} from '@/components/analytics/utils/calculations';
import type { UnifiedBet } from '@/components/analytics/types';

describe('Analytics Calculations', () => {
  describe('calculateWinReturn', () => {
    it('should correctly calculate return for positive American odds', () => {
      // Stake: 100, Odds: +150 -> Return: 250 (100 stake + 150 profit)
      expect(calculateWinReturn(100, 150)).toBe(250);
      expect(calculateWinReturn(50, 200)).toBe(150);
    });

    it('should correctly calculate return for negative American odds', () => {
      // Stake: 110, Odds: -110 -> Return: 210 (110 stake + 100 profit)
      expect(calculateWinReturn(110, -110)).toBe(210);
      expect(calculateWinReturn(150, -150)).toBe(250);
    });
  });

  describe('computeEv', () => {
    it('should calculate positive EV correctly for underdog bets', () => {
      // Stake: 100, Odds: +150 (profit 150), Prob: 0.5 (50%)
      // EV = (0.5 * 150) - (0.5 * 100) = 75 - 50 = 25
      expect(computeEv(100, 150, 0.5)).toBe(25);
    });

    it('should calculate negative EV correctly', () => {
      // Stake: 100, Odds: +100 (profit 100), Prob: 0.4 (40%)
      // EV = (0.4 * 100) - (0.6 * 100) = 40 - 60 = -20
      expect(computeEv(100, 100, 0.4)).toBe(-20);
    });

    it('should calculate zero EV for fair bets', () => {
      // Stake: 110, Odds: -110 (profit 100), Prob: 110/210 = ~0.5238
      // EV = (110/210 * 100) - (100/210 * 110) = 0
      expect(computeEv(110, -110, 110/210)).toBeCloseTo(0, 4);

      // Stake: 100, Odds: +100 (profit 100), Prob: 0.5
      expect(computeEv(100, 100, 0.5)).toBeCloseTo(0, 4);
    });

    it('should handle edge case: 0% probability (guaranteed loss)', () => {
      // Stake: 100, EV should be -100 (loss of full stake)
      expect(computeEv(100, 150, 0)).toBe(-100);
      expect(computeEv(100, -200, 0)).toBe(-100);
    });

    it('should handle edge case: 100% probability (guaranteed win)', () => {
      // Stake: 100, Odds: +150 (profit 150), EV should be 150
      expect(computeEv(100, 150, 1)).toBe(150);
      // Stake: 200, Odds: -200 (profit 100), EV should be 100
      expect(computeEv(200, -200, 1)).toBe(100);
    });
  });

  describe('calculateBettingMetrics', () => {
    const mockUnifiedBets: UnifiedBet[] = [
      {
        id: '1',
        stake: 100,
        odds: 150,
        outcome: 'win', // return: 250 (profit: 150)
        expectedValue: 10,
        betType: 'moneyline',
      } as UnifiedBet,
      {
        id: '2',
        stake: 110,
        odds: -110,
        outcome: 'loss', // return: 0 (profit: -110)
        expectedValue: -5,
        betType: 'spread',
      } as UnifiedBet,
      {
        id: '3',
        stake: 50,
        odds: -200,
        outcome: 'push', // return: 50 (profit: 0)
        expectedValue: 0,
        betType: 'total',
      } as UnifiedBet,
      {
        id: '4',
        stake: 100,
        odds: 300,
        outcome: 'win',
        isParlay: true, // parlay win, return: 400 (profit: 300)
        expectedValue: 25,
        betType: 'parlay',
      } as UnifiedBet,
      {
        id: '5',
        stake: 100,
        odds: 200,
        outcome: 'pending', // ignored in completed metrics
        expectedValue: 5,
        betType: 'moneyline',
      } as UnifiedBet,
      {
        id: '6',
        stake: 50,
        odds: 500,
        outcome: 'loss',
        parlayLegsCount: 3, // parlay loss, return: 0 (profit: -50)
        expectedValue: -15,
        betType: 'parlay',
      } as UnifiedBet,
    ];

    it('should calculate correct basic metrics', () => {
      const metrics = calculateBettingMetrics(mockUnifiedBets);

      expect(metrics.totalBets).toBe(6);
      expect(metrics.completedBets).toBe(5);
      expect(metrics.pendingBets).toBe(1);
      expect(metrics.wins).toBe(2);
      expect(metrics.losses).toBe(2); // push is neither win nor loss

      // Win rate: 2 wins / 5 completed = 40%
      expect(metrics.winRate).toBe(40);

      // Total staked (completed only): 100 + 110 + 50 + 100 + 50 = 410
      expect(metrics.totalStaked).toBe(410);

      // Total returns: 250 (bet 1) + 0 (bet 2) + 50 (bet 3) + 400 (bet 4) + 0 (bet 6) = 700
      expect(metrics.totalReturns).toBe(700);

      // Profit: 700 - 410 = 290
      expect(metrics.profit).toBe(290);

      // ROI: (290 / 410) * 100 = ~70.73%
      expect(metrics.roi).toBeCloseTo((290 / 410) * 100, 2);

      // Avg EV: (10 - 5 + 0 + 25 + 5 - 15) / 6 = 20 / 6 = ~3.33
      expect(metrics.avgEV).toBeCloseTo(20 / 6, 2);
    });

    it('should calculate correct parlay metrics', () => {
      const metrics = calculateBettingMetrics(mockUnifiedBets);

      // Parlays: bet 4 (isParlay), bet 6 (parlayLegsCount > 1)
      expect(metrics.totalParlays).toBe(2);
      expect(metrics.completedParlays).toBe(2);
      expect(metrics.parlayWins).toBe(1);
      expect(metrics.parlayLosses).toBe(1);

      // Parlay Win Rate: 1 / 2 = 50%
      expect(metrics.parlayWinRate).toBe(50);

      // Parlay ROI:
      // Staked = 100 + 50 = 150
      // Returns = 400 + 0 = 400
      // Profit = 250
      // ROI = (250 / 150) * 100 = ~166.67%
      expect(metrics.parlayROI).toBeCloseTo((250 / 150) * 100, 2);

      // Parlay Percentage: 2 parlays / 6 total bets = ~33.33%
      expect(metrics.parlayPercentage).toBeCloseTo((2 / 6) * 100, 2);
    });

    it('should handle empty bet array', () => {
      const metrics = calculateBettingMetrics([]);

      expect(metrics.totalBets).toBe(0);
      expect(metrics.completedBets).toBe(0);
      expect(metrics.winRate).toBe(0);
      expect(metrics.profit).toBe(0);
      expect(metrics.roi).toBe(0);
      expect(metrics.avgEV).toBe(0);
      expect(metrics.totalParlays).toBe(0);
      expect(metrics.parlayPercentage).toBe(0);
    });
  });
});
