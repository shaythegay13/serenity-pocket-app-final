'use client'

/**
 * Flowglad Provider Wrapper
 * 
 * NOTE: FlowgladProvider is currently disabled to prevent errors.
 * The subscription system works via direct API calls to /api/flowglad/checkout
 * without needing the client-side provider.
 * 
 * If you need client-side billing features (like useBilling() hook),
 * you'll need to configure FlowgladProvider with proper authentication.
 */

export function FlowgladProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  // For now, just render children without Flowglad provider
  // The checkout flow works via server-side API calls
  return <>{children}</>
}
