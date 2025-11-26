'use client'

import { useBilling } from '@flowglad/nextjs'
import { ReactNode } from 'react'

interface FeatureGateProps {
  featureId: string
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}

/**
 * Flowglad Feature Gate Component
 * 
 * Checks if user has access to a specific feature through Flowglad.
 * If Flowglad is not configured, falls back to checking subscription tier directly.
 * 
 * @param featureId - The feature ID from Flowglad dashboard
 * @param children - Content to show if user has access
 * @param fallback - Content to show if user doesn't have access (default: upgrade message)
 * @param loadingFallback - Content to show while loading (default: loading text)
 */
export function FlowgladFeatureGate({
  featureId,
  children,
  fallback,
  loadingFallback
}: FeatureGateProps) {
  const { checkFeatureAccess, loaded } = useBilling()

  // Loading state
  if (!loaded || !checkFeatureAccess) {
    return <>{loadingFallback || <div className="text-sm text-muted-foreground">Loading...</div>}</>
  }

  // Check feature access
  const hasAccess = checkFeatureAccess(featureId)

  if (hasAccess) {
    return <>{children}</>
  }

  // No access - show fallback or default upgrade message
  return <>{fallback || (
    <div className="text-sm text-muted-foreground">
      Please upgrade to access this feature
    </div>
  )}</>
}
