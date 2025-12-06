# Authentication Setup Guide

This guide explains how to set up the username/password authentication system for Serenity Pocket.

## Overview

The app now uses **username and password authentication** instead of magic links. Users can:
- Sign up with a username, email, and password
- Sign in with their email and password
- Have their profile data connected to their account

## Database Setup

### 1. Run the Schema SQL

Execute the `supabase-schema.sql` file in your Supabase SQL Editor. This will create:
- `profiles` table - stores user account info (username, name, avatar, etc.)
- `user_profiles` table - stores game data (XP, level, streaks, etc.)
- `emotion_logs`, `trades`, `achievements`, `bias_profiles`, `challenges` tables
- Row Level Security policies for all tables

### 2. Configure Supabase Authentication

In your Supabase dashboard:

1. Go to **Authentication** → **Providers** → **Email**
2. Enable **Email provider**
3. **IMPORTANT**: Disable "Confirm email" if you want instant sign-up without email verification
   - Or keep it enabled for production to verify email addresses
4. Set up email templates if needed

### 3. Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in Supabase Dashboard → Settings → API

## How It Works

### Sign Up Flow

1. User enters username, email, password
2. App checks if username is already taken
3. Creates Supabase auth user with `signUp()`
4. Creates profile entry in `profiles` table with username
5. Auto-signs in the user
6. User is redirected to the main app

### Sign In Flow

1. User enters email and password
2. App calls `signInWithPassword()`
3. Session is created automatically
4. Page reloads to show authenticated state

### Forgot Password Flow

1. User clicks "Forgot password?" on sign-in page
2. Enters email address
3. Receives password reset email (if email exists)
4. Clicks link in email
5. Redirected to reset password page
6. Enters new password
7. Redirected to sign in

### Data Storage

- **Authentication**: Handled by Supabase Auth (`auth.users` table)
- **Profile Info**: Stored in `profiles` table (username, name, age, etc.)
- **Game Data**: Stored in `user_profiles` table (XP, level, tokens, etc.)
- **Activity Data**: Stored in `emotion_logs`, `trades`, `achievements`, etc.

All tables use Row Level Security (RLS) to ensure users can only access their own data.

## Testing

### Test Account Creation

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign up"
4. Fill in username, email, password
5. Submit the form

### Verify Database

In Supabase SQL Editor, check if the profile was created:

```sql
SELECT * FROM profiles;
SELECT * FROM user_profiles;
```

## Troubleshooting

### Users can't sign up

- Check Supabase Dashboard → Authentication → Users
- Verify email provider is enabled
- Check browser console for errors
- Make sure RLS policies are created

### Users can sign up but data doesn't save

- Check if `profiles` and `user_profiles` tables exist
- Verify RLS policies allow INSERT
- Check browser console for database errors

### Email confirmation issues

If using email confirmation:
- Check Supabase Dashboard → Authentication → Email Templates
- Verify the redirect URL is correct
- Users must click the confirmation link before they can sign in

## Migration from Magic Link

If you had existing users with magic link authentication:
- They will need to reset their password or create a new account
- Old sessions will still work until they expire
- Consider adding a password reset flow for existing users
