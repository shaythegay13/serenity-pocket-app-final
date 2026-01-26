import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Auth callback route - primarily for OAuth flows or email verification
// Password authentication is handled directly in the sign-in component
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('Auth error from Supabase:', error, error_description)
    return NextResponse.redirect(new URL(`/?error=${error}`, requestUrl.origin))
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    try {
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Exchange code error:', exchangeError)
        return NextResponse.redirect(new URL('/?error=exchange_failed', requestUrl.origin))
      }

      if (data.session) {
        // Redirect to home page for logged-in users - session will be picked up by client
        return NextResponse.redirect(new URL('/home', requestUrl.origin))
      }
    } catch (err) {
      console.error('Unexpected error in callback:', err)
      return NextResponse.redirect(new URL('/?error=unexpected', requestUrl.origin))
    }
  }

  // No code provided, redirect to home page
  return NextResponse.redirect(new URL('/home', requestUrl.origin))
}
