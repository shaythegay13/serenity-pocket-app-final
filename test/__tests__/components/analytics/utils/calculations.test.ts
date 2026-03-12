import { computeEv, calculateWinReturn } from "../../../../../components/analytics/utils/calculations"

describe("calculations", () => {
  describe("computeEv", () => {
    it("should calculate positive EV correctly", () => {
      // +100 odds, 55% chance to win. Profit = 100
      // EV = (0.55 * 100) - (0.45 * 100) = 55 - 45 = 10
      expect(computeEv(100, 100, 0.55)).toBeCloseTo(10)
    })

    it("should calculate negative EV correctly", () => {
      // +100 odds, 45% chance to win. Profit = 100
      // EV = (0.45 * 100) - (0.55 * 100) = 45 - 55 = -10
      expect(computeEv(100, 100, 0.45)).toBeCloseTo(-10)
    })

    it("should calculate zero EV correctly", () => {
      // +100 odds, 50% chance to win. Profit = 100
      // EV = (0.50 * 100) - (0.50 * 100) = 50 - 50 = 0
      expect(computeEv(100, 100, 0.50)).toBeCloseTo(0)
    })

    it("should handle negative odds", () => {
      // -110 odds, 55% chance to win. Stake 110. Profit = 100
      // EV = (0.55 * 100) - (0.45 * 110) = 55 - 49.5 = 5.5
      expect(computeEv(110, -110, 0.55)).toBeCloseTo(5.5)
    })

    it("should handle fractional probability", () => {
      // -150 odds, 65% chance. Stake 150. Profit = 100.
      // EV = (0.65 * 100) - (0.35 * 150) = 65 - 52.5 = 12.5
      expect(computeEv(150, -150, 0.65)).toBeCloseTo(12.5)
    })
  })

  describe("calculateWinReturn", () => {
    it("should calculate correct return for positive odds", () => {
      // Stake 100, +150 odds. Return = 100 + 150 = 250
      expect(calculateWinReturn(100, 150)).toBeCloseTo(250)
    })

    it("should calculate correct return for negative odds", () => {
      // Stake 110, -110 odds. Return = 110 + 100 = 210
      expect(calculateWinReturn(110, -110)).toBeCloseTo(210)
    })

    it("should handle edge case: stake 0", () => {
      expect(calculateWinReturn(0, 150)).toBe(0)
      expect(calculateWinReturn(0, -110)).toBe(0)
    })
  })
})
