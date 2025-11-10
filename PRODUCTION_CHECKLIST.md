# Production Deployment Checklist

## Pre-Deployment

### 1. Environment Variables
Verify these are set in your deployment platform:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional (if using)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

**Important Notes:**
- All client-side env vars MUST start with `NEXT_PUBLIC_`
- No trailing slashes in URLs
- Use the anon (public) key, not the service role key

### 2. Supabase Configuration

#### Authentication Settings
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL**: `https://www.serenitypocket.com`
3. Add **Redirect URLs**:
   - `https://www.serenitypocket.com/auth/callback`
   - `https://www.serenitypocket.com/**` (wildcard for all routes)

#### Email Templates (if using email confirmation)
1. Go to Authentication → Email Templates
2. Customize confirmation email template
3. Verify "From" email address

#### Database
1. Run all migration scripts in order:
   - `supabase-schema.sql`
   - `supabase-migration-*.sql` files
2. Verify tables exist:
   - `profiles`
   - `user_profiles`
   - `emotion_logs`
   - `trades`
   - etc.

#### Row Level Security (RLS)
Ensure policies are enabled on all tables. Basic policies:

```sql
-- profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### 3. Build Test
Test the production build locally:

```bash
npm run build
npm start
```

Visit `http://localhost:3000` and test:
- [ ] Sign up flow
- [ ] Sign in flow
- [ ] All tabs load without errors
- [ ] No console errors

## Deployment

### Vercel Deployment
```bash
vercel --prod
```

### Other Platforms
```bash
npm run build
# Then deploy the .next folder
```

## Post-Deployment Testing

### Critical Paths
Test these immediately after deployment:

1. **Sign Up Flow**
   - [ ] Open homepage
   - [ ] Complete survey
   - [ ] Create account with unique email
   - [ ] Check email for confirmation (if required)
   - [ ] Verify account creation in Supabase dashboard

2. **Sign In Flow**
   - [ ] Sign in with test account
   - [ ] Verify dashboard loads
   - [ ] Check all tabs work
   - [ ] Test emotion logging
   - [ ] Test trade logging

3. **Error Handling**
   - [ ] Try sign up with existing email
   - [ ] Try sign in with wrong password
   - [ ] Verify error messages display correctly

### Browser Console Check
1. Open DevTools (F12)
2. Check Console tab for errors
3. Should see:
   - ✅ "User authenticated: [email]" (when signed in)
   - ❌ NO red errors
   - ❌ NO "CRITICAL" messages

### Network Tab Check
1. Open DevTools → Network tab
2. Look for:
   - [ ] Supabase API calls succeed (200 status)
   - [ ] No CORS errors
   - [ ] No 404s on assets

## Monitoring

### Daily Checks
- Check Supabase logs for errors
- Monitor user sign-ups
- Check for failed authentication attempts

### Error Tracking
Consider adding:
- Sentry for error tracking
- Google Analytics for user flow
- Custom logging for critical paths

## Rollback Plan

If critical issues occur:

1. **Quick Fix**: Revert to previous deployment
   ```bash
   vercel rollback
   ```

2. **Environment Issues**: 
   - Check env variables in deployment platform
   - Verify Supabase URLs and keys
   - Check Supabase project status (not paused)

3. **Database Issues**:
   - Check RLS policies
   - Verify migrations ran successfully
   - Check for missing tables/columns

## Common Issues & Solutions

### "Client-side exception" Error
**Cause**: Missing env variables or invalid Supabase config
**Solution**: 
1. Verify env variables in deployment platform
2. Check browser console for specific error
3. Check SIGN_UP_ERROR_FIX.md for details

### Email Confirmation Not Sending
**Cause**: Email template or SMTP not configured
**Solution**:
1. Check Supabase → Authentication → Email Templates
2. Verify SMTP settings
3. Disable email confirmation for testing

### CORS Errors
**Cause**: Site URL not configured in Supabase
**Solution**:
1. Add production URL to Supabase URL Configuration
2. Include wildcard redirects

### Session Not Persisting
**Cause**: Cookie issues or auth config
**Solution**:
1. Check browser cookie settings
2. Verify `persistSession: true` in Supabase client config
3. Check for ad-blockers

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **This Project**:
  - `SIGN_UP_ERROR_FIX.md` - Sign-up error troubleshooting
  - `AUTH_SETUP.md` - Authentication setup guide
  - `DATABASE_SETUP.md` - Database configuration
