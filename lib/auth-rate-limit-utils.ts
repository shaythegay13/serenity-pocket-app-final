/**
 * Utility functions for managing auth rate limits
 * Use these during development to clear rate limit cooldowns
 */

export const AUTH_RATE_LIMIT_KEYS = {
  SIGN_IN: 'sign_in_attempts',
  PASSWORD_RESET: 'password_reset_attempts',
  RESEND_CONFIRMATION: 'resend_confirmation_attempts',
} as const

/**
 * Clear all auth rate limit cooldowns from localStorage
 * Useful during development or if a user needs manual cooldown reset
 */
export function clearAllAuthRateLimits() {
  Object.values(AUTH_RATE_LIMIT_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
  console.log('✅ Cleared all auth rate limit cooldowns')
}

/**
 * Enable dev bypass mode to skip client-side rate limiting
 * WARNING: This does NOT bypass Supabase's server-side rate limits
 */
export function enableDevBypass() {
  localStorage.setItem('dev_bypass_rate_limit', 'true')
  console.log('🚨 DEV MODE ENABLED: Client-side rate limiting bypassed')
  console.warn('⚠️ This does NOT bypass Supabase server-side rate limits')
}

/**
 * Disable dev bypass mode
 */
export function disableDevBypass() {
  localStorage.removeItem('dev_bypass_rate_limit')
  console.log('✅ DEV MODE DISABLED: Rate limiting re-enabled')
}

/**
 * Clear a specific auth rate limit cooldown
 */
export function clearAuthRateLimit(type: keyof typeof AUTH_RATE_LIMIT_KEYS) {
  const key = AUTH_RATE_LIMIT_KEYS[type]
  localStorage.removeItem(key)
  console.log(`✅ Cleared ${type} rate limit cooldown`)
}

/**
 * Get current rate limit status for debugging
 */
export function getAuthRateLimitStatus() {
  const status = Object.entries(AUTH_RATE_LIMIT_KEYS).map(([name, key]) => {
    const stored = localStorage.getItem(key)
    if (!stored) return { name, status: 'No cooldown', attempts: 0 }
    
    try {
      const data = JSON.parse(stored)
      const now = Date.now()
      const inCooldown = data.cooldownUntil && data.cooldownUntil > now
      const remainingMs = inCooldown ? data.cooldownUntil - now : 0
      const remainingMinutes = Math.ceil(remainingMs / 60000)
      
      // Check for stale attempts (older than 10 min)
      const recentAttempts = (data.attempts || []).filter(
        (timestamp: number) => timestamp > now - (10 * 60 * 1000)
      )
      const staleAttempts = (data.attempts || []).length - recentAttempts.length
      
      return {
        name,
        status: inCooldown ? `🔒 Cooldown: ${remainingMinutes}m remaining` : recentAttempts.length > 0 ? '⚠️ Recent attempts tracked' : '✅ Clear',
        attempts: recentAttempts.length,
        staleAttempts,
        cooldownUntil: data.cooldownUntil ? new Date(data.cooldownUntil).toLocaleString() : 'None',
        raw: data
      }
    } catch {
      return { name, status: '❌ Invalid data', attempts: 0 }
    }
  })
  
  console.table(status)
  return status
}

/**
 * Force clear all expired cooldowns and stale attempts
 */
export function cleanupExpiredCooldowns() {
  const now = Date.now()
  let cleaned = 0
  
  Object.entries(AUTH_RATE_LIMIT_KEYS).forEach(([name, key]) => {
    const stored = localStorage.getItem(key)
    if (!stored) return
    
    try {
      const data = JSON.parse(stored)
      
      // Remove expired cooldown
      if (data.cooldownUntil && data.cooldownUntil <= now) {
        delete data.cooldownUntil
        cleaned++
      }
      
      // Clean up old attempts (older than 10 minutes)
      if (data.attempts && Array.isArray(data.attempts)) {
        const oldLength = data.attempts.length
        data.attempts = data.attempts.filter(
          (timestamp: number) => timestamp > now - (10 * 60 * 1000)
        )
        if (data.attempts.length < oldLength) {
          cleaned++
        }
      }
      
      // Save cleaned data or remove if empty
      if (!data.cooldownUntil && (!data.attempts || data.attempts.length === 0)) {
        localStorage.removeItem(key)
        console.log(`✅ Cleared empty ${name} data`)
      } else {
        localStorage.setItem(key, JSON.stringify(data))
        console.log(`🧹 Cleaned ${name} data`)
      }
    } catch (e) {
      localStorage.removeItem(key)
      console.log(`❌ Removed invalid ${name} data`)
      cleaned++
    }
  })
  
  console.log(`✅ Cleanup complete! Cleaned ${cleaned} items.`)
  return cleaned
}

// Make available globally for debugging (only in browser)
if (typeof window !== 'undefined') {
  (window as any).authDebug = {
    clearAll: clearAllAuthRateLimits,
    clear: clearAuthRateLimit,
    status: getAuthRateLimitStatus,
    cleanup: cleanupExpiredCooldowns,
    enableDevBypass,
    disableDevBypass,
  }
  console.log('🔧 Auth debug utils available: window.authDebug')
  console.log('   - window.authDebug.status() - Check rate limit status')
  console.log('   - window.authDebug.clearAll() - Clear all rate limits')
  console.log('   - window.authDebug.cleanup() - Clean up expired cooldowns')
  console.log('   - window.authDebug.enableDevBypass() - Skip client-side rate limiting')
  console.log('   - window.authDebug.disableDevBypass() - Re-enable rate limiting')
}
