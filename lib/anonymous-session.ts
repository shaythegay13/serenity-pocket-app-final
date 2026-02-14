const ANON_SESSION_KEY = 'pml_anonymous_session_id'

/**
 * Generate a UUID v4 without external dependency.
 * Uses crypto.randomUUID() (available in all modern browsers and Node 19+).
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get or create anonymous session ID from localStorage.
 * Client-side only.
 */
export function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem(ANON_SESSION_KEY)
  if (!sessionId) {
    sessionId = generateUUID()
    localStorage.setItem(ANON_SESSION_KEY, sessionId)
  }
  return sessionId
}

/**
 * Clear anonymous session (called after successful migration to user account).
 */
export function clearAnonymousSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ANON_SESSION_KEY)
}

/**
 * Check if an anonymous session exists.
 */
export function hasAnonymousSession(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(ANON_SESSION_KEY)
}

/**
 * Validate that a string is a valid UUID v4.
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}
