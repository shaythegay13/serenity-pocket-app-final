# Google OAuth Setup Guide

> **⚠️ NOTE: This feature is currently on hold.**  
> Google OAuth will be implemented after collecting initial users and conducting user research.  
> This documentation is saved for future reference.

## Overview
This guide will help you set up Google Sign-In for Serenity Pocket using Supabase Auth.

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it "Serenity Pocket" (or your preferred name)
4. Click **Create**

### 1.2 Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click **Create**

**App Information:**
- **App name:** Serenity Pocket
- **User support email:** your-email@domain.com
- **App logo:** (Optional) Upload your app logo
- **App domain:**
  - Application home page: `https://your-domain.com`
  - Privacy policy link: `https://your-domain.com/privacy`
  - Terms of service link: `https://your-domain.com/terms`

**Developer contact:**
- Add your email address

4. Click **Save and Continue**

**Scopes:**
- Click **Add or Remove Scopes**
- Add these scopes:
  - `userinfo.email`
  - `userinfo.profile`
  - `openid`
5. Click **Update** → **Save and Continue**

**Test Users (for development):**
- Add your test email addresses
- Click **Save and Continue**

### 1.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "Serenity Pocket Web Client"

**Authorized JavaScript origins:**
```
http://localhost:3000
https://your-production-domain.com
https://<your-supabase-project-ref>.supabase.co
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
```

5. Click **Create**
6. **IMPORTANT:** Copy your:
   - **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abcd1234efgh5678`)

---

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle it **ON**

### 2.2 Add Google Credentials

1. Paste your **Client ID** from Google
2. Paste your **Client Secret** from Google
3. Click **Save**

### 2.3 Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your site URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add redirect URLs (already configured in Supabase by default):
   - `<your-site-url>/auth/callback`

---

## Step 3: Verify OAuth Callback Handler

✅ The callback handler is already enabled at `/app/auth/callback/route.ts`

This route handles:
- OAuth code exchange
- Session creation
- Error handling
- Redirects back to your app

---

## Step 4: Test Google Sign-In

### 4.1 Development Testing

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000`
3. Click **Sign In** or **Sign Up**
4. Click **Continue with Google** button
5. Sign in with your Google account
6. You'll be redirected back to your app

### 4.2 What Happens During OAuth Flow

1. User clicks "Continue with Google"
2. Redirected to Google consent screen
3. User grants permissions
4. Google redirects to `/auth/callback?code=...`
5. Code exchanged for session
6. User redirected to home page

---

## Step 5: Production Deployment

### Update Google Cloud Console

Add your production domain to **Authorized JavaScript origins**:
```
https://your-production-domain.com
```

Add production callback to **Authorized redirect URIs**:
```
https://your-production-domain.com/auth/callback
```

### Update Supabase

In Supabase Dashboard → **Authentication** → **URL Configuration**, update Site URL to production domain.

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verify redirect URIs in Google Console match exactly
- Check for http vs https
- Ensure no trailing slashes mismatch

### Google Sign-In Button Not Working
- [ ] Google provider enabled in Supabase
- [ ] Client ID and Secret configured
- [ ] Callback route exists
- [ ] Environment variables set

### Session Not Persisting
- Check browser console for errors
- Verify callback route is working
- Check Supabase Authentication Logs

---

## Benefits

✅ **Faster sign-up:** One click vs. forms  
✅ **Higher conversion:** Less friction  
✅ **Better security:** No password management  
✅ **Trust factor:** Users trust Google auth  
✅ **Auto-fill data:** Get name/email automatically

---

**Done!** Your users can now sign in with Google! 🎉

