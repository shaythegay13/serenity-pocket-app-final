import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'

/**
 * GET /api/marketplace/products
 * 
 * Fetch all active marketplace products for AI service credits
 */
export async function GET() {
  try {
    const supabase = supabaseServer

    const { data: products, error } = await supabase
      .from('ai_marketplace_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[Marketplace Products] Fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      products: products || [] 
    })
  } catch (error) {
    console.error('[Marketplace Products] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch marketplace products' 
      },
      { status: 500 }
    )
  }
}
