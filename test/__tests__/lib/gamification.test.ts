/**
 * Gamification utility tests
 */

import { getLevelTitle, checkPerfectDay, shouldResetRings, TOKEN_MILESTONES } from '@/lib/gamification'

describe('getLevelTitle', () => {
  it('returns "Beginner" for levels 1-4', () => {
    expect(getLevelTitle(1)).toBe('Beginner')
    expect(getLevelTitle(4)).toBe('Beginner')
  })

  it('returns "Apprentice" for levels 5-9', () => {
    expect(getLevelTitle(5)).toBe('Apprentice')
    expect(getLevelTitle(9)).toBe('Apprentice')
  })

  it('returns "Rising Star" for levels 10-19', () => {
    expect(getLevelTitle(10)).toBe('Rising Star')
    expect(getLevelTitle(19)).toBe('Rising Star')
  })

  it('returns "Skilled Bettor" for levels 20-29', () => {
    expect(getLevelTitle(20)).toBe('Skilled Bettor')
    expect(getLevelTitle(29)).toBe('Skilled Bettor')
  })

  it('returns "Senior Strategist" for levels 30-39', () => {
    expect(getLevelTitle(30)).toBe('Senior Strategist')
    expect(getLevelTitle(39)).toBe('Senior Strategist')
  })

  it('returns "Expert Analyst" for levels 40-49', () => {
    expect(getLevelTitle(40)).toBe('Expert Analyst')
    expect(getLevelTitle(49)).toBe('Expert Analyst')
  })

  it('returns "Master Trader" for level 50+', () => {
    expect(getLevelTitle(50)).toBe('Master Trader')
    expect(getLevelTitle(100)).toBe('Master Trader')
  })
})

describe('checkPerfectDay', () => {
  it('returns true when all rings are at 100%', () => {
    expect(checkPerfectDay({
      emotionalAwareness: 100,
      biasRecognition: 100,
      mindfulness: 100,
    })).toBe(true)
  })

  it('returns false when any ring is below 100%', () => {
    expect(checkPerfectDay({
      emotionalAwareness: 99,
      biasRecognition: 100,
      mindfulness: 100,
    })).toBe(false)

    expect(checkPerfectDay({
      emotionalAwareness: 100,
      biasRecognition: 50,
      mindfulness: 100,
    })).toBe(false)
  })

  it('returns true when rings exceed 100%', () => {
    expect(checkPerfectDay({
      emotionalAwareness: 150,
      biasRecognition: 100,
      mindfulness: 120,
    })).toBe(true)
  })
})

describe('shouldResetRings', () => {
  it('returns true when lastRingReset is undefined', () => {
    expect(shouldResetRings(undefined)).toBe(true)
  })

  it('returns true when lastRingReset is from a different day', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(shouldResetRings(yesterday)).toBe(true)
  })

  it('returns false when lastRingReset is from today', () => {
    const today = new Date()
    expect(shouldResetRings(today)).toBe(false)
  })

  it('handles string date format', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(shouldResetRings(yesterday.toISOString())).toBe(true)
  })
})

describe('TOKEN_MILESTONES', () => {
  it('contains expected milestone tokens', () => {
    const tokens = TOKEN_MILESTONES.map(m => m.tokens)
    expect(tokens).toContain(100)
    expect(tokens).toContain(250)
    expect(tokens).toContain(500)
    expect(tokens).toContain(1000)
    expect(tokens).toContain(2500)
  })

  it('has unique IDs for each milestone', () => {
    const ids = TOKEN_MILESTONES.map(m => m.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})
