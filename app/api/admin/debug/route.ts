/**
 * Debug endpoint to check authentication status
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'No auth header found',
        hint: 'Make sure you include: Authorization: Bearer YOUR_TOKEN'
      }, { status: 400 });
    }

    const token = authHeader.substring(7);
    console.log('Debug: Token length:', token.length);
    console.log('Debug: Token starts with:', token.substring(0, 20) + '...');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      return NextResponse.json({
        error: 'Invalid token',
        details: error.message,
        tokenLength: token.length
      }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({
        error: 'No user found for token',
        tokenLength: token.length
      }, { status: 401 });
    }

    // Check admin status
    const isAdminUser = Boolean(
      user.email === 'info@playmindlabs.com' || 
      user.email === 'playmindlabsllc@gmail.com' ||
      user.user_metadata?.role === 'admin' ||
      (user.email && user.email.endsWith('@playmindlabs.com'))
    );

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        id: user.id,
        isAdmin: isAdminUser,
        metadata: user.user_metadata
      },
      tokenLength: token.length
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
