import { NextRequest, NextResponse } from 'next/server'

/**
 * ESPN API Proxy
 * Bypasses CORS restrictions by making requests from the server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const endpoint = body?.endpoint as string | undefined
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      )
    }

    // Validate ESPN domain
    if (!endpoint.includes('espn.com') && !endpoint.includes('espncdn.com')) {
      return NextResponse.json(
        { error: 'Invalid endpoint - must be ESPN domain' },
        { status: 400 }
      )
    }

    console.log(`[ESPN Proxy] Fetching: ${endpoint}`)
    
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn(`[ESPN Proxy] Failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `ESPN API returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`[ESPN Proxy] Success for ${endpoint}`)
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('[ESPN Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from ESPN' },
      { status: 500 }
    )
  }
}
