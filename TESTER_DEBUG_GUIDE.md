# Tester Debug Guide

## How to Get Error Details

If you see the error:
> **"application error: a client-side exception has occurred"**

Follow these steps to help us fix it:

### Step 1: Open Browser Developer Tools
1. **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. **Firefox**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. **Safari**: Enable Developer menu first (Safari → Preferences → Advanced → Show Develop menu), then press `Cmd+Option+I`

### Step 2: Check the Console Tab
1. Click on the **Console** tab in the developer tools
2. Try signing up again
3. Look for error messages (usually in red)
4. Take a screenshot of any errors you see

### Step 3: Things to Look For

**Critical Errors** (these are the most important):
- Messages starting with `❌ CRITICAL:`
- Messages mentioning "Supabase"
- Messages about "sessionStorage"
- Any message in red text

**Example errors you might see:**
```
❌ CRITICAL: Supabase environment variables are missing!
Failed to fetch
NetworkError
sessionStorage is not defined
```

### Step 4: Check the Network Tab
1. Click on the **Network** tab in developer tools
2. Try signing up again
3. Look for any requests with a red status (like 404, 500, etc.)
4. Take a screenshot if you see any failed requests

### Step 5: Share the Information

Send us:
1. Screenshot of the Console tab errors
2. Screenshot of the Network tab (if there are failed requests)
3. Your browser name and version
4. Your operating system
5. Whether you're using any ad-blockers or privacy extensions

### Quick Tests You Can Try

**Test 1: Clear Browser Data**
1. Clear your browser cache and cookies
2. Try signing up again

**Test 2: Try Incognito/Private Mode**
1. Open an incognito/private browsing window
2. Visit the site and try signing up
3. Let us know if it works or gives the same error

**Test 3: Try a Different Browser**
1. If possible, try Chrome, Firefox, or Safari
2. See if the error happens in all browsers or just one

**Test 4: Check Your Internet Connection**
1. Verify you have a stable internet connection
2. Try visiting other websites to ensure they load properly

## What We're Looking For

The most helpful information is:
- ✅ Exact error message from the Console
- ✅ Any red text or stack traces
- ✅ Failed network requests
- ✅ Browser and OS info

With this information, we can quickly identify and fix the issue!

## After the Fix

Once we've deployed a fix:
1. Clear your browser cache
2. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
3. Try signing up again

You should now see either:
- ✅ A successful sign-up
- 📋 A more detailed error message (with a "Reload" button)

Thank you for helping us improve the app! 🙏
