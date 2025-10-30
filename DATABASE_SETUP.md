# Database Setup Guide

This guide will help you set up the Supabase database for persistent data storage.

## Prerequisites

- A Supabase account (https://supabase.com)
- Your Supabase project URL and anon key already configured in `.env.local`

## Setup Steps

### 1. Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### 2. Run the Database Schema

1. Open the file `supabase-schema.sql` in this repository
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor
4. Click "Run" to execute the schema

This will create all necessary tables:
- `user_profiles` - Stores user data, XP, levels, streaks
- `emotion_logs` - Stores emotion check-ins
- `trades` - Stores trading decisions and outcomes
- `achievements` - Stores achievement progress
- `bias_profiles` - Stores cognitive bias scores
- `challenges` - Stores weekly challenges

### 3. Verify Tables Were Created

1. Click on "Table Editor" in the left sidebar
2. You should see all the tables listed above
3. Each table should have Row Level Security (RLS) enabled

### 4. Test the Connection

1. Run your app locally: `npm run dev`
2. Sign in with your email
3. Check your profile - data should now persist between sessions
4. Check the Supabase Table Editor to see your data

## How It Works

### Data Persistence

- **Authenticated Users**: Data is automatically saved to Supabase database
- **Fallback**: LocalStorage is used as a cache and fallback
- **Sync**: Data syncs across all devices where you're logged in

### Row Level Security (RLS)

All tables have RLS policies that ensure:
- Users can only view their own data
- Users can only modify their own data
- Data is isolated between users

### Automatic Features

- **Profile Creation**: First-time users get a profile created automatically
- **Data Migration**: Existing localStorage data can be migrated (coming soon)
- **Offline Support**: Changes are cached locally and synced when online

## Data Schema

### User Profiles
Stores all user progress, levels, XP, streaks, and statistics.

### Emotion Logs
Tracks emotional check-ins with timestamps for historical analysis.

### Trades
Records trading decisions, emotions, biases, and outcomes.

### Achievements  
Tracks progress toward unlocking achievements and badges.

### Bias Profiles
Stores susceptibility scores for different cognitive biases.

### Challenges
Manages weekly community challenges and progress.

## Troubleshooting

### "Supabase is not properly configured" Error
- Verify your `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure these environment variables are also set in your Vercel deployment

### Data Not Saving
- Check browser console for errors
- Verify you're signed in
- Check Supabase logs for any database errors

### RLS Policy Errors
- Ensure you ran the complete schema SQL
- Check that Row Level Security is enabled on all tables
- Verify policies were created correctly in the Supabase dashboard

## Migration from LocalStorage (Optional)

If you have existing data in localStorage that you want to migrate to the database:

1. Sign in to your account
2. Your new data will be saved to the database
3. Old localStorage data will remain as a fallback
4. After verification, you can safely clear localStorage

## Support

For issues or questions:
- Check Supabase project logs in the dashboard
- Review browser console errors
- Ensure all environment variables are correctly set
