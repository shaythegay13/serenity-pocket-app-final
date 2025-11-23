import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// TEMPORARY TEST ENDPOINT - Remove in production
export async function POST(req: Request) {
  try {
    const { tier } = await req.json()
    
    // Validate tier
    const validTiers = ['free', 'premium', 'premium_plus', 'elite']
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: `Invalid tier: ${tier}` }, { status: 400 })
    }
    
    // Get auth token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Manually update subscription
    const now = new Date()
    const nextMonth = new Date(now)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    console.log('🧪 Attempting to update subscription for user:', user.id)
    
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
    
    // First check if user profile exists
    const { data: existingProfiles, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)

    if (fetchError) {
      console.error('❌ Error fetching user profile:', fetchError)
      return NextResponse.json({ error: 'Database error: ' + fetchError.message }, { status: 500 })
    }

    console.log('✅ Found profiles:', existingProfiles?.length || 0)
    
    if (!existingProfiles || existingProfiles.length === 0) {
      console.error('❌ No user profile found for user:', user.id)
      return NextResponse.json({ error: 'User profile does not exist' }, { status: 404 })
    }

    const existingProfile = existingProfiles[0]
    console.log('📋 Current subscription fields:', {
      tier: existingProfile?.subscription_tier,
      status: existingProfile?.subscription_status,
      has_tier_column: 'subscription_tier' in existingProfile,
      has_status_column: 'subscription_status' in existingProfile,
    })

    console.log('🧪 Update data:', {
      subscription_tier: tier,
      subscription_status: 'active',
      subscription_started_at: now.toISOString(),
      subscription_ends_at: nextMonth.toISOString(),
    })

    // Set status based on tier
    const status = tier === 'free' ? 'inactive' : 'active'
    const updateData: any = {
      subscription_tier: tier,
      subscription_status: status,
    }
    
    // Only set dates for paid tiers
    if (tier !== 'free') {
      updateData.subscription_started_at = now.toISOString()
      updateData.subscription_ends_at = nextMonth.toISOString()
    } else {
      updateData.subscription_started_at = null
      updateData.subscription_ends_at = null
    }

    console.log('🧪 Final update data:', updateData)

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()

    if (error) {
      console.error('❌ Error updating subscription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Subscription updated successfully:', data)
    console.log('✅ Updated row count:', data?.length || 0)

    if (!data || data.length === 0) {
      console.error('⚠️ Update succeeded but no rows returned')
      return NextResponse.json({ 
        error: 'Update succeeded but no data returned' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Subscription updated to ${tier}`,
      data: data[0]
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
