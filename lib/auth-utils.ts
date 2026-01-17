import { supabase } from './supabase'

/**
 * Utility function to handle refresh token errors
 * Call this when you encounter "Invalid Refresh Token" errors
 */
export const handleRefreshTokenError = async () => {
  console.log('🔧 Handling refresh token error...')
  
  try {
    // Sign out from Supabase
    await supabase.auth.signOut({ scope: 'local' })
    
    // Clear all Supabase-related storage
    if (typeof window !== 'undefined') {
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('supabase.')) {
          sessionStorage.removeItem(key)
        }
      })
      
      console.log('✅ Auth state cleared successfully')
    }
    
    // Redirect to home page for fresh login
    window.location.href = "/"
    
  } catch (error) {
    console.error('❌ Error clearing auth state:', error)
    // Fallback: force reload
    window.location.reload()
  }
}

/**
 * Check if current error is refresh token related
 */
export const isRefreshTokenError = (error: any): boolean => {
  if (error instanceof Error) {
    return error.message.includes('Invalid Refresh Token') || 
           error.message.includes('Refresh Token Not Found') ||
           error.message.includes('refresh_token')
  }
  return false
}

/**
 * Enhanced error handler for auth operations
 */
export const handleAuthError = async (error: any) => {
  console.error('🔐 Auth error:', error)
  
  if (isRefreshTokenError(error)) {
    await handleRefreshTokenError()
    return true // Indicated that error was handled
  }
  
  return false // Error was not a refresh token error
}
