import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user account exists with this email
    const { data: userData, error: userError } = await supabaseServer.auth.admin.listUsers();

    if (userError) {
      console.error('Error checking for user account:', userError);
      return NextResponse.json(
        { error: 'Failed to check account status' },
        { status: 500 }
      );
    }

    // Check if any user has this email
    const accountExists = userData.users.some(user => user.email === email);

    return NextResponse.json({
      accountExists,
      message: accountExists
        ? 'An account already exists with this email'
        : 'No account found'
    });
  } catch (error: any) {
    console.error('Check account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
