import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { flowglad } from '@/lib/flowglad'

export async function POST(req: Request) {
  try {
    // Get authenticated user from authorization header
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

    // Check if Flowglad is configured
    if (!process.env.FLOWGLAD_SECRET_KEY || process.env.FLOWGLAD_SECRET_KEY.trim().length === 0) {
      return NextResponse.json(
        { error: 'Flowglad not configured' },
        { status: 500 }
      )
    }

    // Get billing info (includes billingPortalUrl) via Flowglad SDK
    const userMeta = user.user_metadata as Record<string, unknown>
    const flowgladServer = flowglad(user.id, {
      email: user.email,
      name: userMeta?.full_name as string || userMeta?.name as string,
    })

    const billing = await flowgladServer.getBilling()

    if (!billing.billingPortalUrl) {
      return NextResponse.json(
        { error: 'Billing portal not available' },
        { status: 404 }
      )
    }

    return NextResponse.json({ url: billing.billingPortalUrl })
  } catch (error: unknown) {
    console.error('Error retrieving billing portal:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve billing portal' },
      { status: 500 }
    )
  }
}
