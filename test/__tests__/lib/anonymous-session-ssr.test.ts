/**
 * @jest-environment node
 */
import {
  getAnonymousSessionId,
  hasAnonymousSession,
  clearAnonymousSession
} from '@/lib/anonymous-session'

describe('anonymous-session (SSR)', () => {
  describe('getAnonymousSessionId', () => {
    it('should return empty string when window is undefined', () => {
      expect(getAnonymousSessionId()).toBe('')
    })
  })

  describe('hasAnonymousSession', () => {
    it('should return false when window is undefined', () => {
      expect(hasAnonymousSession()).toBe(false)
    })
  })

  describe('clearAnonymousSession', () => {
    it('should not throw when window is undefined', () => {
      expect(() => clearAnonymousSession()).not.toThrow()
    })
  })
})
