import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    // Authenticate user from Authorization header
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

    // Flowglad does not currently expose a hosted billing portal endpoint via the SDK.
    // Return null with an informative message so the client can handle gracefully.
    return NextResponse.json({
      url: null,
      message: 'Billing portal not available. Please contact support to manage your billing.',
    })
  } catch (error: unknown) {
    let details: string
    if (typeof error === 'object' && error !== null) {
      try {
        details = JSON.stringify(error)
      } catch {
        details = String(error)
      }
    } else {
      details = String(error)
    }

    return NextResponse.json(
      { error: 'Failed to get billing portal', details },
      { status: 500 }
    )
  }
}
