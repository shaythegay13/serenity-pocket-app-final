# 🔐 Supabase Redirect URL Configuration

Your magic link authentication needs one more step in the Supabase dashboard!

## ⚠️ Important: Add Redirect URL to Supabase

### Step 1: Go to Supabase Dashboard

1. Open https://app.supabase.com
2. Select your project: **wlutkohnrwpfakxwazlj**

### Step 2: Configure Redirect URLs

1. In the left sidebar, go to **Authentication** → **URL Configuration**
2. Find the **Redirect URLs** section
3. Add these URLs:
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback
   ```

### Step 3: Save Changes

Click **Save** at the bottom of the page.

---

## ✅ What We Fixed in the Code:

1. **Created `/app/auth/callback/route.ts`** 
   - Handles the magic link token exchange
   - Redirects to home page after successful auth

2. **Updated sign-in redirect**
   - Changed from `window.location.origin` 
   - To `${window.location.origin}/auth/callback`

---

## 🧪 Test After Setup:

1. **Restart your dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Request a new magic link**:
   - Go to your app
   - Enter your email
   - Click "Send magic link"

3. **Check your email and click the link**:
   - Should redirect to `/auth/callback`
   - Then redirect to home page
   - ✅ You should be logged in!

---

## 🔍 Debugging:

If it still doesn't work, check the browser console for errors:
- Press `F12` → Console tab
- Look for "Auth callback error" messages

---

## 📝 Note:

The redirect URLs in Supabase must **exactly match** what your app is sending. If you're using a different local port or production domain, update the URLs accordingly.
