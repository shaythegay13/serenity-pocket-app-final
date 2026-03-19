/**
 * @jest-environment jsdom
 */
import {
  getAnonymousSessionId,
  hasAnonymousSession,
  clearAnonymousSession,
  isValidUUID
} from '@/lib/anonymous-session'

const ANON_SESSION_KEY = 'pml_anonymous_session_id'

describe('anonymous-session (client-side)', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('getAnonymousSessionId', () => {
    it('should create and return a new session ID when none exists', () => {
      const sessionId = getAnonymousSessionId()

      expect(sessionId).toBeDefined()
      expect(isValidUUID(sessionId)).toBe(true)
      expect(localStorage.getItem(ANON_SESSION_KEY)).toBe(sessionId)
    })

    it('should return the existing session ID when it exists', () => {
      const existingId = '123e4567-e89b-12d3-a456-426614174000'
      localStorage.setItem(ANON_SESSION_KEY, existingId)

      const sessionId = getAnonymousSessionId()

      expect(sessionId).toBe(existingId)
    })
  })

  describe('hasAnonymousSession', () => {
    it('should return false when no session exists', () => {
      expect(hasAnonymousSession()).toBe(false)
    })

    it('should return true when a session exists', () => {
      localStorage.setItem(ANON_SESSION_KEY, 'some-id')
      expect(hasAnonymousSession()).toBe(true)
    })
  })

  describe('clearAnonymousSession', () => {
    it('should remove the session ID from localStorage', () => {
      localStorage.setItem(ANON_SESSION_KEY, 'some-id')
      clearAnonymousSession()
      expect(localStorage.getItem(ANON_SESSION_KEY)).toBeNull()
      expect(hasAnonymousSession()).toBe(false)
    })
  })

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUUID('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('should return false for invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(false) // Not version 4
      expect(isValidUUID('')).toBe(false)
    })
  })
})
