# Serenity Pocket

Final public snapshot of **Serenity Pocket**, Shay Bouchles’s behavioral sports-betting web app. This is the last iteration kept in this repository before the product continued as **PlayMind Labs**.

**Serenity Pocket is not live.** Nothing in this repository is a running production service. You can install and build the app locally. Sign-in, saved data, live odds, Gemini analysis, and paid subscriptions need the external accounts described under [Setup](#setup).

The interface in this tree already uses the PlayMind Labs name. `package.json` is named `playmind-labs`. The About page, metadata, and pricing copy say PlayMind Labs. Local storage keys and several SQL comments still say Serenity.

## Place in the history

| When | What the repository records |
| --- | --- |
| October 25, 2025 | Repository initialized as “Serenity Pocket app”. The first commit is from v0. |
| October 2025 – February 2026 | Supabase auth and storage, surveys, emotion check-ins, bet analysis, and subscription work land on this codebase. |
| February 8, 2026 | Commit `e644059` renames the product in the site from Serenity Pocket to PlayMind Labs. |
| March 28, 2026 | Last commit in this snapshot. |

PlayMind Labs is the name the product carried out of this repository. This tree is the archive of that handoff, kept as a portfolio record of the Serenity Pocket work. Later PlayMind Labs development is not in this repo.

## What this snapshot does

The signed-in product is a sports-betting companion. It tracks how the bettor feels, compares that with bets they log, and offers odds-based analysis. It is aimed at sports bettors. Early types and the database notes still use the word “trade”; the screens in this snapshot are betting screens.

Verified from the code in this tree:

- **Public site.** `/` renders the landing page. Marketing and policy pages include `/about`, `/features`, `/how-it-works`, `/pricing`, `/faq`, `/contact`, `/privacy`, `/terms`, and `/responsible-use`.
- **Serenity Survey.** `/serenity` is a 12-question assessment that returns a betting archetype and a risk profile. `/pgsi` redirects there. The PGSI page states that hybrid scoring can infer a PGSI risk level inside the Serenity Survey. `/gambling-survey` redirects to `/survey`.
- **Public emotion check-in.** `/check-in` and `POST /api/public/emotion-checkin` accept a check-in without an account.
- **Accounts.** Email and password sign-up and sign-in go through Supabase Auth (`/login`, `/auth/callback`, `/auth/reset-password`). Authenticated data is stored with the hybrid storage layer. The same layer keeps a `localStorage` cache under `serenity_*` keys.
- **Home.** `/home` is the signed-in shell. Navigation is Home, My Mind (`/behavior`), BetLab, Analytics, and Account. The first visit to Home in a browser session opens an emotion check-in.
- **My Mind.** The behavior route renders the emotions tab: core emotions, sub-emotions, intensity, and notes, saved as emotion logs.
- **BetLab.** `/betlab`, `/betlab/smartslip`, and `/betlab/tiltlab` load the AI picks experience. Free-tier accounts see a premium wall. Paid tiers get SmartSlip suggestions and TiltLab-style analysis of the bettor’s own bets, including parlays. Odds are assembled in `lib/enhanced-odds-api.ts` from The Odds API, a RapidAPI sportsbook source, and TheSportsDB. Sport keys in `lib/sports-config.ts` cover major US leagues plus soccer, tennis, golf, combat sports, motorsport, and cricket.
- **Analysis APIs.** `POST /api/ai/analyze-bet` always runs a built-in analysis and calls Gemini when `GOOGLE_GEMINI_API_KEY` is set. `POST /api/analyze-bet` returns HTTP 503 when Gemini is not configured. Both bet-analysis and picker routes call `psych_model_picker.py` with `execFile`. If that process fails, the picker route substitutes a default model payload.
- **Marketplace.** `/marketplace` and `/betlab/marketplace` list products that grant AI picker and bet-analyzer credits. Purchase goes through `/api/marketplace/purchase` and Flowglad when Flowglad is configured.
- **Analytics.** `/analytics/performance`, `/analytics/correlation`, and `/analytics/mentalhealth` show performance, emotion-to-outcome correlation, and mental-health views. Access requires the Focus tier or higher (`canAccessFeature` in `lib/subscription-tiers.ts`).
- **Subscriptions.** Tiers in code are Foundation (`free`, $0), Focus (`premium`, $19.99/month, 7-day trial), Mastery (`premium_plus`, $39.99/month), and Apex (`elite`, $79.99/month). Flowglad handles checkout, the billing portal, cancel, downgrade, and webhooks. The landing page offers 100 founding Apex spots; `GET /api/stats/founding-spots` counts `user_profiles` rows with `subscription_tier = elite` against that cap.
- **Safety controls present in the UI.** Account settings include a cooldown switch. SmartSlip reads `cooldownEnabled` before generating picks. `/responsible-use` is a public page. `DELETE` support for a user’s data lives at `/api/user/delete`.
- **Scheduled routes.** `vercel.json` registers three cron paths: weekly usage reset, a daily revenue check, and a weekly sport-season update. They run only on a host that honors that file.

A `BiasesTab` component and bias-profile storage exist. The signed-in navigation does not mount that tab.

`/demo` is a placeholder page. It does not launch a product tour.

`capacitor.config.ts` names an iOS/Android app id and `next.config.mjs` can emit a static export when `BUILD_MODE=mobile`. This `package.json` has no Capacitor sync scripts, and the `android/` and `ios/` projects are not in the tree.

## Stack

Verified from `package.json` and the imports those libraries actually have:

- **App:** Next.js 16.1 (App Router), React 19, TypeScript
- **UI:** Tailwind CSS 4, Radix UI, shadcn/ui (`components.json`, style `new-york`), Lucide icons, Recharts
- **Auth and data:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Billing:** Flowglad (`@flowglad/nextjs`)
- **AI:** Google Gemini from `lib/gemini.ts` and `lib/ai-service.ts`
- **Email alerts:** Nodemailer
- **Analytics beacon:** Vercel Web Analytics in the root layout
- **Tests:** Jest and Testing Library
- **Python helper:** `psych_model_picker.py` at the repo root, invoked by the Node API routes above

`@capacitor/cli` is a dev dependency. `better-auth`, `socket.io-client`, and `zustand` are listed in `package.json` and are not imported by the application source.

## Architecture

```text
app/                  App Router pages and route handlers
  api/                Odds-backed picks, surveys, Flowglad, cron, account deletion
  home, behavior,     Signed-in surfaces
  betlab, analytics
components/           Landing page, dashboard chrome, tabs, auth, charts
contexts/             Supabase session (AuthContext) and flow state
features/             Serenity survey, TiltLab, and flow-state controllers
lib/                  Supabase clients, hybrid storage, odds, tiers, Gemini
services/             Expected-value and probability helpers
supabase/migrations/  SQL migrations, including supabase-schema.sql
migrations/           Later SQL for subscriptions, parlays, marketplace, usage
psych_model_picker.py Model-selection helper called from the API
vercel.json           Cron schedules for the three routes under app/api/cron
```

```text
Browser
  │
  ├─ Public pages and /serenity, /check-in
  │
  └─ Supabase Auth session
        │
        ▼
     /home shell
        ├─ emotions  → storageHybrid → Supabase, with serenity_* localStorage
        ├─ BetLab    → /api/picker/recommend and /api/ai/analyze-bet
        │                 ├─ enhanced odds (The Odds API, RapidAPI, TheSportsDB)
        │                 ├─ Gemini when GOOGLE_GEMINI_API_KEY is set
        │                 └─ python psych_model_picker.py
        ├─ Analytics → emotion logs, bet analyses, parlays
        └─ Account   → tier, cooldown, Flowglad portal
```

Row Level Security is declared in the SQL migrations. Server routes that must bypass it use `SUPABASE_SERVICE_ROLE_KEY` (`lib/supabaseAdmin.ts` and the routes that import it).

## Setup

Verified with Node.js 22 and npm 10: `npm ci` completes, `npm run build` completes, and `npm test` passes (154 tests).

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The dev server is Next.js (`next dev`). Production build and serve:

```bash
npm run build
npm start
```

Tests:

```bash
npm test
```

Create a Supabase project and put its URL and anon key in `.env.local`. Add the service-role key before using server routes that write profiles, count founding spots, or send Flowglad webhooks. SQL for the tables lives in two places:

- `supabase/migrations/` — base schema and later survey, profile, and season migrations. The schema file referenced by the older database guide is `supabase/migrations/supabase-schema.sql`.
- `migrations/` — subscriptions, bet analyses, parlays, marketplace, and AI usage.

Apply the SQL in the Supabase SQL editor. `docs/DATABASE_SETUP.md` and `docs/AUTH_SETUP.md` still describe the earlier Serenity Pocket setup and mention table names from that pass. Prefer the SQL files over those guides when they disagree.

Leave Gemini, odds, Flowglad, weather, and email blank if you only need the UI to boot. Those features stay inactive or return the errors described above until the matching variables are set. Variable names are listed in `.env.example`.

## Contributors

From this repository’s git history:

- **Shay Bouchles** — product and engineering. Commits are also recorded as `shaybouchles`, `shaythegay13`, and `boks`.
- **petter2025us** — allowed anonymous survey responses to store a null email, and removed an unused ESLint directive.
- **GitHub Copilot** (`Copilot`, `copilot-swe-agent`) — Flowglad billing, account subscription controls, and SEO pull requests.
- **v0** — initialized the repository and an early mobile-layout commit.
- **Vercel** — added Vercel Web Analytics.

The About page also names Sergio Monterroso and Diamond Mc Pherson as founders. They do not have commits in this history.

## Archive notes

- This snapshot is for reading and local builds. It is not a deployed Serenity Pocket site.
- There is no root license file.
- `docs/` mixes current notes with older Serenity Pocket instructions. Treat the code as the source of truth.
- `aws/` is a vendored AWS CLI v2 bundle. It is not imported by the Next.js app.
- `npm audit` reports dependency advisories. They were not changed in the portfolio README update.
