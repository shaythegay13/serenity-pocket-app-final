# JULESTODO.md — PlayMind Labs: Pilot → Production

> **READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE.**
> This document is the single source of truth for what needs to change to take this repo from pilot to production. Follow the tasks in order. Do not improvise. Do not refactor code that is not listed here. Do not add features. Only do what is written.

---

## 0. ORIENTATION — Understand the Codebase Before You Act

### What this app is
**PlayMind Labs** (`www.playmindlabs.com`) is a decision-psychology SaaS platform for sports bettors and day traders. It combines emotion tracking, cognitive bias detection, AI-powered bet analysis, and responsible gambling tools.

### Tech stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Radix UI, shadcn/ui
- **Database + Auth**: Supabase (Postgres + Auth)
- **Payments**: Flowglad (NOT Stripe — it was migrated away)
- **AI**: Google Gemini (via `lib/gemini.ts` and `lib/ai-service.ts`)
- **Mobile**: Capacitor (iOS/Android wrapper around the web app)
- **Deployment**: Vercel

### Subscription tiers (defined in `lib/subscription-tiers.ts`)
| ID | Display Name | Price |
|----|-------------|-------|
| `free` | Foundation | $0/mo |
| `premium` | Focus | $19.99/mo |
| `premium_plus` | Mastery | $39.99/mo |
| `elite` | Apex | $79.99/mo |

### Critical files to know before editing anything
- `app/layout.tsx` — root layout, global metadata, org schema JSON-LD
- `lib/constants.ts` — `BASE_URL` (resolves to `https://www.playmindlabs.com`)
- `lib/subscription-tiers.ts` — tier definitions and feature gates
- `lib/flowglad.ts` — Flowglad payment client factory
- `app/robots.ts` — robots.txt generation (dynamic, uses `BASE_URL`)
- `app/sitemap.ts` — sitemap generation (dynamic, uses `BASE_URL`)
- `vercel.json` — cron job schedule

### What NOT to do
- **Do NOT refactor working code** unless the task explicitly says to
- **Do NOT rename variables, functions, or files** unless a task says to
- **Do NOT add new dependencies** unless a task specifically calls for one
- **Do NOT delete any migration `.sql` files** in `migrations/`
- **Do NOT touch `better-auth` configuration** — it is pinned to `1.4.13` intentionally
- **Do NOT change Tailwind config or global styles** unless a task says to
- **Do NOT push to `main`** — open a PR for human review on every task group
- **Do NOT touch the Supabase dashboard** — Tasks 1.4, 2.2, and 2.3 require dashboard access that Jules cannot perform; flag them as "HUMAN REQUIRED" in PR comments only and do not attempt to simulate or skip them

---

## TASK GROUP 1 — SECURITY (Do These First — Critical Blockers)

These are production blockers. The app must not go live with paying customers until all of these are done.

---

### TASK 1.1 — Disable the test-subscription endpoint in production

**File**: `app/api/test-subscription/route.ts`

**Problem**: This endpoint allows any authenticated user to freely change their own subscription tier to `elite`, `premium`, `premium_plus`, or `free` without paying. It bypasses Flowglad entirely. The file already has a comment: `// TEMPORARY TEST ENDPOINT - Remove in production`.

**What to do**: At the very top of the exported `POST` function (after the `try {` opening), add this guard as the first statement:

```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
```

Do not delete the file — disabling it with an env check preserves it for local development while making it a dead end in production.

---

### TASK 1.2 — Add authentication to the analyze-bet endpoint

**File**: `app/api/analyze-bet/route.ts`

**Problem**: This endpoint has zero authentication checks (confirmed: `grep -c "auth" app/api/analyze-bet/route.ts` returns 0). Any unauthenticated HTTP request can call it and drain Gemini API credits.

**What to do**: At the top of the `POST` handler function body, before any other logic, add an auth check using the existing pattern from `app/api/flowglad/checkout/route.ts`. The pattern is:

```typescript
const authHeader = request.headers.get('authorization')
if (!authHeader) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
const token = authHeader.replace('Bearer ', '')
const { data: { user }, error: authError } = await supabase.auth.getUser(token)
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

The `supabase` import is already present in the file. Do not restructure the rest of the function — just add the guard at the top.

---

### TASK 1.3 — Add authentication to the AI picks endpoint

**File**: `app/api/ai/analyze-bet/route.ts`

**Problem**: Same as Task 1.2 — this endpoint needs to verify the user is authenticated before consuming AI resources.

**What to do**: Apply the exact same auth guard pattern described in Task 1.2.

---

### TASK 1.4 — Verify RLS is enabled on all user data tables

**Where to do this**: In the Supabase dashboard for the production project, go to the SQL Editor and run the following query:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'emotion_logs',
  'trades',
  'bias_profile',
  'survey_responses',
  'anonymous_survey_submissions',
  'bet_analyses',
  'parlays',
  'parlay_legs',
  'ai_analysis_logs',
  'api_usage_daily'
);
```

For every row where `rowsecurity = false`, run:

```sql
ALTER TABLE <tablename> ENABLE ROW LEVEL SECURITY;
```

Then verify that INSERT, SELECT, UPDATE, and DELETE policies exist for user-owned tables. The pattern to use for any missing policies is in `docs/SECURITY_AUDIT.md` under section 4.

**Note**: Do not run this on the staging/dev Supabase project — confirm which project URL maps to production first by checking the Vercel environment variables.

> **Jules note**: Jules cannot access the Supabase dashboard. Mark this task as **HUMAN REQUIRED** in the PR description. If you can connect to the database locally via `psql` or the Supabase CLI, run the query above and paste the output as a PR comment so the human reviewer knows which tables still need RLS enabled.

---

### TASK 1.5 — Verify Flowglad webhook signature verification is active

**File**: `app/api/flowglad/[...path]/route.ts`

**What to check**: Open this file and confirm that the Flowglad SDK's built-in webhook handler is being used, not a raw `req.json()` call. The Flowglad `@flowglad/nextjs` package handles signature verification internally when you use its handler. If the route is using a raw handler that skips the SDK, add it back.

If the file is already using the Flowglad SDK handler (e.g., `FlowgladServer`), no change is needed — just mark this task done after confirming.

---

## TASK GROUP 2 — ENVIRONMENT VARIABLES (Infrastructure Blockers)

The app will silently fail or fall back to test mode if these are not set correctly in Vercel's production environment.

---

### TASK 2.1 — Audit and set all required environment variables in Vercel

Go to the Vercel dashboard → Project → Settings → Environment Variables. Confirm that **every** variable below is set for the **Production** environment. Do not use development/test values.

**Required for core functionality:**
```
NEXT_PUBLIC_SUPABASE_URL            # Production Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY       # Production Supabase anon key
SUPABASE_SERVICE_ROLE_KEY           # Production Supabase service role key (server-only)
NEXT_PUBLIC_SITE_URL                # https://www.playmindlabs.com (used in lib/constants.ts)
```

**Required for payments (Flowglad):**
```
FLOWGLAD_SECRET_KEY                 # Production Flowglad secret key
FLOWGLAD_WEBHOOK_SECRET             # Production Flowglad webhook secret
NEXT_PUBLIC_FLOWGLAD_PUBLIC_KEY     # Production Flowglad public key
FLOWGLAD_PRICE_PREMIUM              # Price ID for Focus tier ($19.99/mo)
FLOWGLAD_PRICE_PREMIUM_PLUS         # Price ID for Mastery tier ($39.99/mo)
FLOWGLAD_PRICE_ELITE                # Price ID for Apex tier ($79.99/mo)
```

**Required for AI features:**
```
GEMINI_API_KEY                      # Google Gemini API key
```

**Required for cron jobs:**
```
CRON_SECRET                         # Secret token for cron route authorization
```

**Optional but strongly recommended:**
```
NEXT_PUBLIC_ODDS_API_KEY            # The Odds API key for live sports data
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED  # Set to 'false' for launch (disable A/B split)
NEXT_PUBLIC_SURVEY_B_PERCENTAGE     # Set to '0' for launch
```

**Validation step**: After setting all variables, trigger a fresh production deployment and check the Vercel function logs for any `undefined` environment variable warnings.

---

### TASK 2.2 — Update Supabase Auth redirect URLs for production domain

**Where to do this**: Supabase dashboard → Authentication → URL Configuration

**What to set**:
- **Site URL**: `https://www.playmindlabs.com`
- **Redirect URLs** (add all of these):
  - `https://www.playmindlabs.com/auth/callback`
  - `https://www.playmindlabs.com/**`

**Problem context**: `docs/PRODUCTION_CHECKLIST.md` still shows `serenitypocket.com` as the configured URL — this is the old domain. If it is still set in Supabase, email confirmation links and OAuth redirects will break for production users.

---

### TASK 2.3 — Verify Flowglad production price IDs exist and are active

**Where to do this**: Flowglad dashboard → Products

Confirm that price IDs for the three paid tiers (`premium`, `premium_plus`, `elite`) exist in the **production** Flowglad environment and are in **active** status. Copy the price IDs and set them as `FLOWGLAD_PRICE_PREMIUM`, `FLOWGLAD_PRICE_PREMIUM_PLUS`, and `FLOWGLAD_PRICE_ELITE` in Vercel (as per Task 2.1).

---

## TASK GROUP 3 — BRAND CONSISTENCY (SEO + Trust)

Several pages and files still reference the old brand name "Serenity Pocket". This confuses search engines about the site's identity and looks unprofessional to any user who notices it.

---

### TASK 3.1 — Fix the About page metadata title

**File**: `app/about/page.tsx`

**Problem**: The page metadata title likely contains "Serenity Pocket". Locate the `metadata` export or `generateMetadata` function at the top of the file.

**What to change**: Replace any occurrence of `"Serenity Pocket"` in the title or description with `"PlayMind Labs"`.

Target result for the title: `"About Us | PlayMind Labs"`

---

### TASK 3.2 — Fix the About page metadata description

**File**: `app/about/page.tsx`

**Problem**: The meta description likely still references "Serenity Pocket".

**What to change**: Find the `description` field in the metadata and replace any instance of `"Serenity Pocket"` with `"PlayMind Labs"`.

---

### TASK 3.3 — Update the package.json name field

**File**: `package.json`

**Problem**: The `name` field is `"my-v0-project"` — a v0.app default placeholder.

**What to change**:
```json
"name": "playmind-labs"
```

This is a cosmetic fix that prevents confusion in logs and npm output.

---

### TASK 3.4 — Audit all remaining "Serenity Pocket" references in app/

Run this search across the entire `app/` directory:

```bash
grep -rn "Serenity Pocket\|serenitypocket\|serenity-pocket\|SerenityPocket" app/ --include="*.tsx" --include="*.ts"
```

For every match found, replace with the appropriate `PlayMind Labs` equivalent. Do not change file names — only text content inside files. Report every file changed.

---

## TASK GROUP 4 — PUBLIC PAGE SERVER-SIDE RENDERING (SEO Critical)

**Context**: The SEO audit (see `FULL-AUDIT-REPORT.md`) scored the site 28/100 because all page content loads client-side. Search engines and AI crawlers see empty HTML shells. The highest-impact fix is converting public marketing pages from `"use client"` to server components.

**Rule**: Only convert pages listed below. Do NOT convert authenticated app pages (dashboard, betlab, analytics, home, account, etc.) — those are intentionally client-rendered.

**How to convert a page from CSR to SSR in Next.js App Router**:
1. Remove the `"use client"` directive from the top of the file
2. Remove any `useState`, `useEffect`, `useRouter`, `useSearchParams` hooks — replace with static data or server props
3. Any child component that still needs interactivity (buttons, forms, modals) can keep `"use client"` — extract it into a separate component file

---

### TASK 4.1 — Convert `/features` page to a server component

**File**: `app/features/page.tsx`

Check if `"use client"` is at the top. If it is, convert the page to a server component. The features page should be entirely static content — no dynamic data needed. Move any interactive UI (e.g., tab switching, animations) into a separate `components/features-tabs.tsx` client component if needed.

---

### TASK 4.2 — Convert `/pricing` page to a server component

**File**: `app/pricing/page.tsx`

Check if `"use client"` is at the top. The pricing table data is static (defined in `lib/subscription-tiers.ts`). Convert the page to a server component. Move any interactive elements (e.g., toggle between monthly/annual, CTA buttons that open checkout) into a `"use client"` child component.

---

### TASK 4.3 — Convert `/faq` page to a server component

**File**: `app/faq/page.tsx`

Check if `"use client"` is at the top. FAQ content is static. Convert to server component. If there is an accordion/expand interaction, extract it into a `components/faq-accordion.tsx` client component.

---

### TASK 4.4 — Convert `/contact` page to a server component

**File**: `app/contact/page.tsx`

Check if `"use client"` is at the top. The page wrapper and heading can be server-rendered. The contact form itself needs to remain a `"use client"` component — extract it into `components/contact-form.tsx`.

---

### TASK 4.5 — Convert `/about` page to a server component

**File**: `app/about/page.tsx`

Check if `"use client"` is at the top. The founder bios and company description are static. Convert the page to a server component.

---

### TASK 4.6 — Convert `/privacy`, `/terms`, and `/responsible-use` to server components

**Files**:
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/responsible-use/page.tsx`

Legal pages are static content only. Remove `"use client"` from any of these that have it and convert to server components.

---

### TASK 4.7 — Add unique H1 tags to all public marketing pages

**Problem**: The SEO audit found all pages share the same H1 ("The science of smarter betting"). Each public page needs a unique, descriptive H1.

**Target H1 values** — use these exactly:
- `/features` → `"Features That Make Smarter Betting Possible"`
- `/pricing` → `"Simple, Transparent Pricing for Every Bettor"`
- `/faq` → `"Frequently Asked Questions"`
- `/contact` → `"Get In Touch With PlayMind Labs"`
- `/about` → `"About PlayMind Labs"`
- `/how-it-works` → `"How PlayMind Labs Helps You Bet Smarter"`
- `/responsible-use` → `"Responsible Gambling at PlayMind Labs"`
- `/privacy` → `"Privacy Policy"`
- `/terms` → `"Terms of Service"`

Find the existing H1 (`<h1>`) in each page file and replace the text content with the value above. If no H1 exists, add one as the first visible heading in the page.

---

## TASK GROUP 5 — SEO TECHNICAL FIXES

---

### TASK 5.1 — Add `noindex` to login and survey pages

**Files**:
- `app/login/page.tsx`
- `app/survey/page.tsx` (if it exists as a standalone page)
- `app/pgsi-survey/page.tsx`
- `app/gambling-survey/page.tsx` (if it exists)

**What to add**: Each of these files should export a `metadata` object with `robots: noindex`:

```typescript
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```

If a `metadata` export already exists in the file, add the `robots` field to it — do not create a duplicate export.

---

### TASK 5.2 — Verify sitemap does not include auth/survey pages

**File**: `app/sitemap.ts`

Open the file. The `staticPages` array should NOT include:
- `/login`
- `/survey`
- `/pgsi-survey`
- `/gambling-survey`
- `/onboarding` (any variant)
- `/auth` (any variant)
- `/dashboard`, `/home`, `/account`, `/profile`, `/betlab`, `/analytics`

If any of these are present in the array, remove them.

---

### TASK 5.3 — Create a custom 404 page

**File to create**: `app/not-found.tsx`

**What it must contain**:
- A clear heading: `"Page Not Found"`
- A short message: `"The page you're looking for doesn't exist or has been moved."`
- A link back to the homepage using Next.js `<Link href="/">`
- The page must be a server component (no `"use client"`)

Do not add animations, complex layouts, or search bars. Keep it simple.

---

### TASK 5.4 — Create `public/llms.txt`

**File to create**: `public/llms.txt`

**Purpose**: This file helps AI crawlers (ChatGPT, Perplexity, Claude) understand what PlayMind Labs is and which pages are authoritative.

**Content to write**:

```
# PlayMind Labs - llms.txt

PlayMind Labs (https://www.playmindlabs.com) is a decision psychology platform for sports bettors and day traders. It provides emotional tracking, cognitive bias detection, AI-powered bet analysis, and responsible gambling tools.

## Key Pages

- Homepage: https://www.playmindlabs.com/
- Features: https://www.playmindlabs.com/features
- Pricing: https://www.playmindlabs.com/pricing
- How It Works: https://www.playmindlabs.com/how-it-works
- FAQ: https://www.playmindlabs.com/faq
- About: https://www.playmindlabs.com/about
- Contact: https://www.playmindlabs.com/contact
- Responsible Gambling: https://www.playmindlabs.com/responsible-use
- Privacy Policy: https://www.playmindlabs.com/privacy
- Terms of Service: https://www.playmindlabs.com/terms

## Subscription Tiers

- Foundation (Free): Emotion tracking, check-ins, cooldown mode
- Focus ($19.99/mo): Basic analytics, AI tools 1x/week
- Mastery ($39.99/mo): Advanced analytics, AI tools 3x/week
- Apex ($79.99/mo): Full AI suite, priority support, 7x/week

## Company

Founders: Shay Bouchles (CEO), Sergio Monterroso (CFO)
Founded: 2025
Category: Behavioral FinTech / Responsible Gambling Technology
```

---

## TASK GROUP 6 — FUNCTIONAL VERIFICATION (QA Before Launch)

These are not code changes — they are manual verification steps that must be confirmed before going live.

---

### TASK 6.1 — Run a full production build and confirm it passes

```bash
npm run build
```

The build must complete with zero errors. TypeScript errors, missing module errors, and invalid import errors all count as failures. Fix any errors found before proceeding. Do not use `--no-verify` or suppress error output.

---

### TASK 6.2 — Verify the complete signup and onboarding flow

With the production deployment:
1. Go to `https://www.playmindlabs.com`
2. Start the survey / onboarding flow
3. Create a new account with a fresh email address
4. Confirm you reach the dashboard
5. Check the Supabase dashboard and verify a new row in `user_profiles` was created
6. Check that the user's subscription tier is `free` by default

If any step fails, do not proceed to the next task group.

---

### TASK 6.3 — Verify subscription checkout flow (Flowglad)

With a test user account:
1. Navigate to the pricing page
2. Click "Upgrade" on the Focus tier ($19.99)
3. Confirm Flowglad checkout opens (not a test mode fallback)
4. Complete the checkout using a Flowglad test card
5. Confirm the user's `subscription_tier` updates to `premium` in Supabase

If Flowglad is not in production mode (still using test keys), confirm that the Flowglad dashboard shows the test transaction recorded.

---

### TASK 6.4 — Verify AI analyze-bet requires authentication after Task 1.2

> **Run in production after deploy** — Jules cannot curl the live site from its VM. If running locally, substitute `http://localhost:3000` for the domain. Otherwise, leave the exact curl command in the PR description and mark as **HUMAN REQUIRED** for post-deploy verification.

```bash
curl -X POST https://www.playmindlabs.com/api/analyze-bet \
  -H "Content-Type: application/json" \
  -d '{"description":"test","odds":100,"stake":10}'
```

Expected response: `{"error":"Unauthorized"}` with HTTP 401.

If the response is anything else (200, 500, actual analysis), Task 1.2 was not implemented correctly. Fix it.

---

### TASK 6.5 — Confirm test-subscription endpoint is blocked in production after Task 1.1

> **Run in production after deploy** — Jules cannot curl the live site from its VM. If running locally, substitute `http://localhost:3000` and set `NODE_ENV=production` to simulate. Otherwise, leave the exact curl command in the PR description and mark as **HUMAN REQUIRED** for post-deploy verification.

```bash
curl -X POST https://www.playmindlabs.com/api/test-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <any_valid_user_token>" \
  -d '{"tier":"elite"}'
```

Expected response: `{"error":"Not found"}` with HTTP 404.

If the response changes the user's subscription tier, Task 1.1 was not implemented correctly. Fix it.

---

### TASK 6.6 — Verify weekly usage reset cron is functional

**File**: `app/api/cron/reset-weekly-usage/route.ts`

Confirm the endpoint requires the `CRON_SECRET` environment variable to authorize calls (not just open to anyone). If it does not check for a secret:

Add this at the top of the handler:
```typescript
const secret = request.headers.get('authorization')
if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Vercel's cron runner automatically passes the `CRON_SECRET` as a Bearer token when `CRON_SECRET` is set in the environment.

---

## TASK GROUP 7 — CLEANUP (Do Last, After All Above Are Done)

These tasks reduce technical debt but are not launch blockers. Only do these after Groups 1–6 are fully done and verified.

---

### TASK 7.1 — Move stray root-level files to appropriate locations

The following files are in the project root but should not be:
- `delete_user_data.sql` → move to `migrations/`
- `delete_user_data_v2.sql` → move to `migrations/`
- `user_profiles_rows.csv` → **DELETE this file** — it may contain real user data and must not be in a git repository. Confirm it is in `.gitignore` or remove it from the repo entirely using `git rm --cached user_profiles_rows.csv`
- `server.log` → **DELETE this file** — log files should not be committed. Add `*.log` to `.gitignore` if not already there.
- `find-utah.js`, `inspect-espn.js` → move to a `scripts/dev/` folder or delete if they were one-off debugging scripts

---

### TASK 7.2 — Add `*.log` and `*.csv` to `.gitignore`

**File**: `.gitignore`

Add these lines if not already present:
```
*.log
server.log
*.csv
user_profiles_rows.csv
```

---

### TASK 7.3 — Archive the root-level audit/summary markdown files

The following files exist at the project root and were created during development audits. They add noise but are not harmful. Move them to a `docs/archive/` folder (create it if it doesn't exist):

- `AI_ANALYSIS_FIXES_SUMMARY.md`
- `ALL_SPORTS_FIXED.md`
- `DEBUG_SUMMARY.md`
- `EMOTIONAL_STABILITY_UNIFICATION_SUMMARY.md`
- `Frontend Parlay Integration.md`
- `GEO-ANALYSIS.md`
- `LOGIN_REDIRECT_FIXED.md`
- `PAGE-ANALYSIS.md`
- `PARLAY_AUDIT_REPORT.md`
- `SCHEMA-ANALYSIS.md`
- `SEO-PROGRESS-REPORT.md`
- `SITEMAP-ANALYSIS.md`
- `SMARTSLIP_CLEANUP_COMPLETE.md`
- `SMARTSLIP_INSIGHTS_ANALYSIS.md`
- `SPORTS_FIX_PLAN.md`
- `TILTLAB_CLEANUP_COMPLETE.md`

Do NOT move or delete:
- `README.md`
- `CLAUDE.md`
- `AGENTS.md`
- `ACTION-PLAN.md`
- `FULL-AUDIT-REPORT.md`
- This file (`JULESTODO.md`)

---

## PROGRESS TRACKER

Use this checklist to track completion. Do not mark a task done unless it has been verified (not just written).

### Group 1 — Security
- [ ] 1.1 — Disable test-subscription in production
- [ ] 1.2 — Add auth to analyze-bet endpoint
- [ ] 1.3 — Add auth to AI picks endpoint
- [ ] 1.4 — Verify RLS on all data tables (done in Supabase dashboard)
- [ ] 1.5 — Verify Flowglad webhook signature verification

### Group 2 — Environment Variables
- [ ] 2.1 — All env vars set in Vercel production
- [ ] 2.2 — Supabase auth URLs updated to playmindlabs.com
- [ ] 2.3 — Flowglad production price IDs verified

### Group 3 — Brand Consistency
- [ ] 3.1 — About page title fixed
- [ ] 3.2 — About page description fixed
- [ ] 3.3 — package.json name updated
- [ ] 3.4 — Full grep audit for "Serenity Pocket" across app/

### Group 4 — Server-Side Rendering
- [ ] 4.1 — /features converted to server component
- [ ] 4.2 — /pricing converted to server component
- [ ] 4.3 — /faq converted to server component
- [ ] 4.4 — /contact converted to server component
- [ ] 4.5 — /about converted to server component
- [ ] 4.6 — /privacy, /terms, /responsible-use converted
- [ ] 4.7 — Unique H1 tags on all public pages

### Group 5 — SEO Technical
- [ ] 5.1 — noindex on login and survey pages
- [ ] 5.2 — Sitemap excludes auth/survey/app pages
- [ ] 5.3 — Custom 404 page created
- [ ] 5.4 — public/llms.txt created

### Group 6 — Functional Verification
- [ ] 6.1 — `npm run build` passes with zero errors
- [ ] 6.2 — Full signup + onboarding flow verified
- [ ] 6.3 — Subscription checkout flow verified (Flowglad)
- [ ] 6.4 — analyze-bet returns 401 without auth (curl test)
- [ ] 6.5 — test-subscription returns 404 in production (curl test)
- [ ] 6.6 — Weekly cron reset endpoint requires CRON_SECRET

### Group 7 — Cleanup (do last)
- [ ] 7.1 — Stray root-level files moved or deleted
- [ ] 7.2 — .gitignore updated for logs and CSVs
- [ ] 7.3 — Root audit/summary MDs archived

---

## DEFINITION OF "PRODUCTION READY"

This repo is production ready when:
1. All items in Groups 1–6 are checked off
2. `npm run build` passes cleanly
3. A real signup → checkout → subscription upgrade flow works end-to-end on `www.playmindlabs.com`
4. No unauthenticated endpoint can consume AI API credits
5. The test-subscription bypass is confirmed dead in production
6. All Supabase URLs and auth redirects point to `playmindlabs.com` (not `serenitypocket.com`)

Group 7 cleanup is strongly recommended but not a launch blocker.

---

*This document was generated based on a full codebase audit on 2026-03-12.*
*Do not edit this file to mark tasks complete — use the Progress Tracker checkboxes above.*
