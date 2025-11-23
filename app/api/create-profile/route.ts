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

    console.log('🔨 Creating profile for user:', user.id, user.email)

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

    // Create profile with subscription fields using admin client
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        name: user.email?.split('@')[0] || 'User',
        level: 1,
        xp: 0,
        xp_to_next_level: 100,
        emotional_awareness_streak: 0,
        bias_recognition_score: 0,
        mindful_decision_percentage: 0,
        total_trades: 0,
        mindful_trades: 0,
        serenity_tokens: 0,
        daily_rings: { emotionalAwareness: 0, biasRecognition: 0, mindfulness: 0 },
        last_ring_reset: new Date().toISOString(),
        perfect_days: 0,
        longest_streak: 0,
        total_emotions_logged: 0,
        total_biases_identified: 0,
        total_journals_completed: 0,
        total_modules_completed: 0,
        total_breathing_exercises: 0,
        most_productive_day: 0,
        subscription_tier: 'free',
        subscription_status: 'inactive',
      })
      .select()

    if (error) {
      console.error('❌ Error creating profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Profile created:', data)

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
