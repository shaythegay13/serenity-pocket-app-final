import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'pml_anon_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 days

// Simple UUID v4 validation
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * GET /api/anonymous-session
 *
 * Reads or creates the anonymous session httpOnly cookie.
 * Accepts optional `clientId` query param to sync with localStorage.
 */
export async function GET(request: NextRequest) {
  const existing = request.cookies.get(COOKIE_NAME)?.value

  if (existing && isValidUUID(existing)) {
    return NextResponse.json({ sessionId: existing })
  }

  // Accept client-side ID to keep localStorage and cookie in sync
  const clientId = request.nextUrl.searchParams.get('clientId')
  const sessionId = clientId && isValidUUID(clientId) ? clientId : generateUUID()

  const response = NextResponse.json({ sessionId })
  response.cookies.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  return response
}
