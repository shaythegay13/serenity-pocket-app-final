'use client'

import { FlowgladProvider } from '@flowglad/nextjs'

/**
 * Flowglad Provider Wrapper
 *
 * Conditionally enables FlowgladProvider when the public key is configured.
 * This is required for client-side billing hooks (useBilling()) and the
 * customer portal to work correctly.
 *
 * When the public key is absent (e.g. local dev without .env.local) the
 * provider is omitted and children are rendered directly so the rest of the
 * app still functions.
 */

const publicKey = process.env.NEXT_PUBLIC_FLOWGLAD_PUBLIC_KEY

export function FlowgladProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  if (!publicKey) {
    return <>{children}</>
  }

  return (
    <FlowgladProvider loadBilling={true}>
      {children}
    </FlowgladProvider>
  )
}
