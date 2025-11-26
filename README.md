# Serenity Pocket

*Decision Psychology Platform for Sports Bettors & Day Traders*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/saved-by-the-plates-projects/v0-serenity-pocket-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/BiWkTzA027R)
[![Mobile Ready](https://img.shields.io/badge/Mobile-iOS%20%26%20Android-blue?style=for-the-badge&logo=apple)](./MOBILE_DEPLOYMENT.md)

## Overview

Serenity Pocket helps sports bettors and day traders make smarter decisions by managing the psychological risks and emotional costs of their financial pursuits. Our platform combines emotional tracking, cognitive bias identification, and mindfulness techniques to build discipline and reduce emotionally-driven losses.

### Who Is This For?

- **Sports Bettors**: Manage tilt, avoid revenge betting, and make disciplined wagers
- **Day Traders**: Control FOMO, reduce impulsive trades, and build consistent strategies
- **Both**: Anyone making fast-paced financial decisions under pressure

### Key Features

- **Serenity Survey**: Personalized onboarding to understand your goals and challenges
- **Daily Emotion Check-Ins**: Track emotional states before making decisions
- **Cognitive Bias Detection**: Identify patterns like confirmation bias, loss aversion, and overconfidence
- **Decision Journal**: Pre and post-decision reflection tools
- **Mindfulness Exercises**: Breathing techniques and meditation timers
- **Progress Analytics**: Visualize emotional patterns and their correlation with outcomes
- **Gamification**: Level up, earn achievements, and build streaks for consistent practice

### Platform Support

- **Web App**: Deployed on Vercel and synced with [v0.app](https://v0.app)
- **iOS**: Native app for iPhone and iPad (App Store ready)
- **Android**: Native app for phones and tablets (Google Play ready)
- **Cross-Platform**: Single codebase powered by Capacitor

## Deployment

Your project is live at:

**[https://vercel.com/saved-by-the-plates-projects/v0-serenity-pocket-app](https://vercel.com/saved-by-the-plates-projects/v0-serenity-pocket-app)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/BiWkTzA027R](https://v0.app/chat/projects/BiWkTzA027R)**

## User Flow

1. **Serenity Survey**: Complete a brief questionnaire about your betting/trading habits and emotional challenges
2. **Account Creation**: Set up your secure account with email and password
3. **Terms Agreement**: Review and accept platform terms and privacy policy
4. **Dashboard Access**: Start using the free tier immediately with all essential features
5. **Upgrade Later**: Access premium tiers when they launch (Q2 2025)

## How It Works

### Web Development

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

### Mobile Development

Build native iOS and Android apps from this codebase:

**Quick Start:**
```bash
# Install dependencies
npm install --legacy-peer-deps

# Build for mobile
npm run build:mobile

# Add platforms
npm run cap:add:ios      # macOS with Xcode required
npm run cap:add:android  # Android Studio required

# Open in native IDE
npm run cap:open:ios
npm run cap:open:android
```

**Documentation:**
- 📱 [Quick Start Guide](./MOBILE_QUICK_START.md) - Get started in 5 minutes
- 📚 [Complete Deployment Guide](./MOBILE_DEPLOYMENT.md) - Full App Store submission guide
- 🎨 [App Resources Guide](./resources/README.md) - Icons and splash screens

## Getting Started

### Web App Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Mobile App Development

See [MOBILE_QUICK_START.md](./MOBILE_QUICK_START.md) for detailed instructions.

## Environment Setup

1. Copy the environment template:
   ```bash
   cp ENV_TEMPLATE.txt .env.local
   ```

2. Configure your Supabase credentials in `.env.local`

3. See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database configuration

## Documentation

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Supabase database setup
- [AUTH_SETUP.md](./AUTH_SETUP.md) - Authentication configuration
- [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md) - Mobile app deployment
- [MOBILE_QUICK_START.md](./MOBILE_QUICK_START.md) - Quick mobile setup

## Architecture & Extension

### Stack

- Next.js 16 (app router), React 19, TypeScript, Tailwind v4, Radix UI
- Supabase (auth, DB), Stripe (subscriptions), Capacitor (mobile)

### Frontend structure

- App routes: dashboard and marketing pages under `app/`
- Core tabs in `components/tabs/*`: home, live-odds, analyze-bet, behavior, ai-picks, history, account
- Onboarding: `components/onboarding/*` (Instant Profile, Profile Preview, Soft Gate)
- Survey flow with A/B: `components/integrated-survey-flow/*` and `lib/abTesting`

### Tiering & Feature Gates

- Tier model and helpers: `lib/subscription-tiers.ts` (`canAccessFeature`, `getUpgradeMessage`)
- UI gate overlay: `components/feature-gate.tsx`
- Tiers: `free`, `premium`, `premium_plus`, `elite`

### Behavioral Safeguards

- User settings (e.g., `cooldownEnabled`) and derived stability guard used to limit actions
- Guards and banners applied across Live Odds, Analyze Bet, AI Picks, and Home quick actions

### APIs

- Live Odds: `app/api/odds/route.ts` → `lib/odds-api.ts`
- Analyze Bet: `app/api/analyze-bet/route.ts` (uses OpenAI when configured, falls back to mock)
- AI Picks: `app/api/ai-picks/route.ts` (uses OpenAI when configured, falls back to mock)
- Surveys: `app/api/gambling-survey*` (A/B variants), with services under `lib/`

### Environment

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- A/B testing: `NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED`, `NEXT_PUBLIC_SURVEY_B_PERCENTAGE`
- Odds API: `NEXT_PUBLIC_ODDS_API_KEY` (The Odds API)
- Place real keys in `.env.local`

### Payment Processing: Flowglad

**Payment Processor**: The subscription system uses **Flowglad** for payment processing (migrated from Stripe on 2024-01-08).

**Development Mode:**
- Flowglad checkout automatically falls back to test mode if credentials aren't configured
- Users can subscribe to any tier without payment for local development
- Subscriptions are set to "active" status with a 1-month duration

**Setup Instructions:**
- See [FLOWGLAD_MIGRATION_GUIDE.md](FLOWGLAD_MIGRATION_GUIDE.md) for complete setup
- Configure environment variables in `.env.local` (see ENV_FLOWGLAD_TEMPLATE.txt)
- Run database migration: `/migrations/20240108_migrate_to_flowglad.sql`

**Migration Documentation:**
- [FLOWGLAD_MIGRATION_GUIDE.md](FLOWGLAD_MIGRATION_GUIDE.md) - Complete setup guide
- [STRIPE_TO_FLOWGLAD_SUMMARY.md](STRIPE_TO_FLOWGLAD_SUMMARY.md) - Migration summary
- [ENV_FLOWGLAD_TEMPLATE.txt](ENV_FLOWGLAD_TEMPLATE.txt) - Environment variables

### Mobile

- Capacitor build scripts in `package.json` and guides under docs
- Run `npm run build:mobile` and sync/open with the provided commands