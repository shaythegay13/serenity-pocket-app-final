/**
 * Script to clear bias quiz history for testing
 * Run in browser console on your test account
 */

// Clear from localStorage
localStorage.removeItem('serenity_bias_history')
console.log('✅ Cleared bias history from localStorage')

// Also clear the current bias profile if you want to retake the quiz fresh
localStorage.removeItem('serenity_bias_profile')
console.log('✅ Cleared bias profile from localStorage')

console.log('🎯 Bias history cleared! You can now retake the quiz with the new scoring system.')
console.log('Note: If logged in, you may also want to clear from Supabase manually via SQL Editor.')
