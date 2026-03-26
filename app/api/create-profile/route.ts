import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force create user profile
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create profile with only columns that currently exist in the DB schema.
    // NOTE: gamification columns (level, xp, serenity_tokens, daily_rings, etc.)
    // were removed in migration 20260213_cleanup_user_profiles_columns.sql
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        name: user.email?.split('@')[0] || 'User',
        email: user.email,
        total_trades: 0,
        mindful_trades: 0,
        total_emotions_logged: 0,
        total_biases_identified: 0,
        total_journals_completed: 0,
        subscription_tier: 'free',
        subscription_status: 'active',
      }, { onConflict: 'id', ignoreDuplicates: false })
      .select()

    if (error) {
      console.error('Error creating profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile created successfully',
      profile: data 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}
