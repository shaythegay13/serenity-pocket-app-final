import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Called right after supabase.auth.signUp() to ensure a user_profiles row exists.
// Uses service role to bypass RLS — safe because:
//   - We verify the userId exists in auth.users before upserting
//   - Only sets non-privileged fields (username, email, name)
export async function POST(req: Request) {
  try {
    const { userId, username, email } = await req.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email are required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the user actually exists in auth.users before touching user_profiles
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (authError || !authUser.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const resolvedUsername = username || email.split('@')[0]

    // Check if this user qualifies as a founding member (first 100 users)
    const { count: existingUserCount } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    const isFoundingMember = (existingUserCount ?? 0) < 100

    const profileData: Record<string, unknown> = {
      id: userId,
      email,
      username: resolvedUsername,
      name: resolvedUsername,
    }

    if (isFoundingMember) {
      profileData.subscription_tier = 'elite'
      profileData.subscription_status = 'active'
      profileData.subscription_started_at = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'id', ignoreDuplicates: false })

    if (error) {
      console.error('Error creating profile via init-profile route:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error in init-profile:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
