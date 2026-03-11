import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { flowglad, isFlowgladConfigured } from '@/lib/flowglad'

/**
 * POST /api/flowglad/portal
 *
 * Creates a Flowglad "add payment method" checkout session URL so users can
 * update their payment method and manage billing.
 *
 * Returns: { url: string }
 */
export async function POST(req: Request) {
  try {
    // Require Flowglad credentials
    if (!isFlowgladConfigured()) {
      return NextResponse.json(
        { error: 'Payment processor not configured', code: 'FLOWGLAD_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth token' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const flowgladServer = flowglad(user.id, { email: user.email })

    // Ensure the customer exists in Flowglad
    await flowgladServer.findOrCreateCustomer()

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

    const session = await flowgladServer.createAddPaymentMethodCheckoutSession({
      successUrl: `${baseUrl}?tab=account&billing=updated`,
      cancelUrl: `${baseUrl}?tab=account`,
    })

    return NextResponse.json({ url: session.url, success: true })
  } catch (error: unknown) {
    console.error('Error creating billing portal session:', error)

    let details: string
    if (typeof error === 'object' && error !== null) {
      try { details = JSON.stringify(error) } catch { details = String(error) }
    } else {
      details = String(error)
    }

    return NextResponse.json(
      { error: 'Failed to create billing portal session', details },
      { status: 500 }
    )
  }
}
