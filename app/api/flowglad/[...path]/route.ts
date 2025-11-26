import { NextResponse } from 'next/server'

/**
 * Main Flowglad API Route Handler
 * 
 * NOTE: This route is disabled because FlowgladProvider is not in use.
 * The subscription system works via direct API calls to /api/flowglad/checkout.
 * 
 * This prevents Flowglad SDK from making requests that return HTML errors.
 */

export async function GET(req: Request) {
  return NextResponse.json(
    { error: 'Flowglad provider not configured' },
    { status: 501 }
  )
}

export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'Flowglad provider not configured' },
    { status: 501 }
  )
}
