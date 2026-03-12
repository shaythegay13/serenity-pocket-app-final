import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { nextRouteHandler } from '@flowglad/nextjs/server'
import { supabase } from '@/lib/supabase'
import { flowglad, isFlowgladConfigured } from '@/lib/flowglad'

/**
 * Main Flowglad API Route Handler
 *
 * Delegates to Flowglad's nextRouteHandler when credentials are configured.
 * This is required for Flowglad's client-side billing hooks (useBilling()) and
 * customer portal features.
 */

// Build the real handler once (credentials may not be present in dev without .env.local)
const handler = isFlowgladConfigured()
  ? nextRouteHandler({
      getCustomerExternalId: async (req: NextRequest) => {
        const authHeader = req.headers.get('authorization')
        if (!authHeader) throw new Error('Missing authorization header')
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (error || !user) throw new Error('Invalid or expired token')
        return user.id
      },
      flowglad,
    })
  : null

function notConfiguredResponse() {
  return NextResponse.json(
    { error: 'Payment processor not configured', code: 'FLOWGLAD_NOT_CONFIGURED' },
    { status: 503 }
  )
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  if (!handler) return notConfiguredResponse()
  return handler.GET(request, context)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  if (!handler) return notConfiguredResponse()
  return handler.POST(request, context)
}
