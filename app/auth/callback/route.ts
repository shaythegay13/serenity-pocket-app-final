import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Log for debugging
  console.log('Auth callback - code:', !!code, 'error:', error)

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
        console.log('Session created successfully, setting cookies')
        
        // Create response with redirect
        const response = NextResponse.redirect(new URL('/', requestUrl.origin))
        
        // Set session cookies manually
        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: false, // Must be false for client-side access
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })
        
        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })
        
        return response
      }
    } catch (err) {
      console.error('Unexpected error in callback:', err)
      return NextResponse.redirect(new URL('/?error=unexpected', requestUrl.origin))
    }
  }

  console.log('No code provided, redirecting to home')
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
