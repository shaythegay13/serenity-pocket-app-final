# 🔒 Security Audit & Recommendations

## ✅ Current Security Status

### **1. Service Role Key Usage - GOOD**
All service role key usage is properly isolated to server-side API routes:
- ✅ `/api/test-subscription/route.ts` - Creates admin client server-side only
- ✅ `/api/user/subscription/route.ts` - Creates admin client server-side only
- ✅ Never exposed in client-side code
- ✅ Only used in Next.js API routes (server-side)

### **2. Authentication - GOOD**
All protected API routes verify authentication:
- ✅ `/api/stripe/checkout` - Validates Bearer token
- ✅ `/api/test-subscription` - Validates Bearer token
- ✅ `/api/user/subscription` - Validates Bearer token
- ✅ `/api/analyze-bet` - No auth (intentional for demo, see recommendations)

### **3. Row Level Security (RLS) - GOOD**
Basic RLS policies are in place:
- ✅ Users can only view their own profile
- ✅ Users can only update their own profile
- ✅ Users can only insert their own profile
- ✅ Service role bypasses RLS when needed (admin operations)

---

## ⚠️ CRITICAL ACTIONS REQUIRED

### **1. Remove Test Endpoint Before Production**
**File:** `/app/api/test-subscription/route.ts`

**Issue:** This endpoint allows manual subscription changes without Stripe payment.

**Action:**
```bash
# Delete this file before deploying to production
rm /app/api/test-subscription/route.ts
```

**Or** add environment check:
```typescript
// At the top of the file
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 403 })
}
```

---

## 🔧 RECOMMENDED SECURITY IMPROVEMENTS

### **2. Add Authentication to AI Analysis Endpoint**
**File:** `/app/api/analyze-bet/route.ts`

**Current:** No authentication required
**Risk:** Anyone can call this endpoint and consume your OpenAI credits

**Fix:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // Add authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rest of the code...
```

### **3. Add Rate Limiting**
**Risk:** API abuse, especially for AI analysis and live odds

**Recommended Solution:** Use Vercel's built-in rate limiting or add middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimit = new Map<string, { count: number; resetTime: number }>()

export function middleware(request: NextRequest) {
  const ip = request.ip || 'anonymous'
  const now = Date.now()
  const limit = 100 // requests per minute
  const windowMs = 60000 // 1 minute

  const userLimit = rateLimit.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
  } else if (userLimit.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  } else {
    userLimit.count++
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

### **4. Enhance RLS Policies for Other Tables**
Check if these tables have RLS enabled:
- `emotion_logs`
- `trades`
- `bias_profile`
- `survey_responses`
- `anonymous_survey_submissions`

**Action:** Run this SQL in Supabase to check:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('emotion_logs', 'trades', 'bias_profile', 'survey_responses', 'anonymous_survey_submissions');
```

If `rowsecurity` is `false`, enable RLS and add policies:
```sql
-- Example for emotion_logs
ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emotion logs" ON emotion_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emotion logs" ON emotion_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emotion logs" ON emotion_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emotion logs" ON emotion_logs
  FOR DELETE
  USING (auth.uid() = user_id);
```

### **5. Add Input Validation**
**Current:** Basic validation in some endpoints
**Recommended:** Add comprehensive validation

```typescript
// Example for bet analysis
import { z } from 'zod'

const BetAnalysisSchema = z.object({
  description: z.string().min(10).max(500),
  odds: z.number().min(-1000).max(1000),
  stake: z.number().min(0).max(100000),
  emotionalState: z.string().optional(),
  emotionalIntensity: z.number().min(0).max(10).optional(),
})

// In the API route
const validated = BetAnalysisSchema.safeParse(body)
if (!validated.success) {
  return NextResponse.json(
    { error: 'Invalid input', details: validated.error },
    { status: 400 }
  )
}
```

### **6. Secure Environment Variables**
**Checklist:**
- ✅ Never commit `.env.local` to git (already in `.gitignore`)
- ⚠️ Rotate keys after any accidental exposure
- ⚠️ Use different keys for development and production
- ⚠️ Set up environment variables in your hosting platform (Vercel/Netlify)

### **7. Add CORS Headers (if needed)**
If you plan to call your API from other domains:

```typescript
// In API routes
export async function POST(req: Request) {
  const response = NextResponse.json({ ... })
  
  // Only allow your domain
  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}
```

### **8. Add Webhook Signature Verification**
**File:** `/app/api/webhooks/stripe/route.ts`

Ensure Stripe webhook signature is verified (should already be in place).

---

## 📋 Pre-Production Security Checklist

- [ ] **Remove or disable `/api/test-subscription` endpoint**
- [ ] **Add authentication to `/api/analyze-bet`**
- [ ] **Enable RLS on all user data tables**
- [ ] **Add rate limiting to API routes**
- [ ] **Verify Stripe webhook signature verification**
- [ ] **Set up production environment variables**
- [ ] **Use different API keys for dev/prod**
- [ ] **Add input validation with Zod**
- [ ] **Review and test all RLS policies**
- [ ] **Set up error monitoring (Sentry)**
- [ ] **Add logging for security events**
- [ ] **Test authentication flows thoroughly**
- [ ] **Verify no sensitive data in client-side code**
- [ ] **Check for exposed API keys in browser DevTools**

---

## 🚨 Production Environment Variables

Ensure these are set in your hosting platform (NOT in code):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_production_secret_key
STRIPE_WEBHOOK_SECRET=your_production_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_production_publishable_key
STRIPE_PRICE_ID_PREMIUM=price_xxx
STRIPE_PRICE_ID_PREMIUM_PLUS=price_xxx
STRIPE_PRICE_ID_ELITE=price_xxx

# App
NEXT_PUBLIC_URL=https://yourdomain.com

# Optional
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key
```

---

## 🔍 Security Testing Commands

```bash
# 1. Check for exposed secrets in code
grep -r "sk_live" .
grep -r "service_role" .

# 2. Test authentication on all API routes
curl -X POST http://localhost:3000/api/analyze-bet \
  -H "Content-Type: application/json" \
  -d '{"description":"test","odds":100,"stake":10}'
# Should return 401 after adding auth

# 3. Test RLS policies in Supabase SQL Editor
SELECT * FROM user_profiles WHERE id != auth.uid();
-- Should return 0 rows

# 4. Verify environment variables are not in client bundle
npm run build
grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/
# Should return 0 results
```

---

## ✅ Summary

**Current Status:** Good foundation, but needs hardening before production

**Priority Actions:**
1. 🔴 **CRITICAL:** Remove/disable test subscription endpoint
2. 🟡 **HIGH:** Add authentication to AI analysis endpoint
3. 🟡 **HIGH:** Enable RLS on all data tables
4. 🟢 **MEDIUM:** Add rate limiting
5. 🟢 **MEDIUM:** Add comprehensive input validation

**Timeline:** Complete items 1-3 before going live. Items 4-5 can be added shortly after launch.
