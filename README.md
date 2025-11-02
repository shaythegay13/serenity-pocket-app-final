# Serenity Pocket app

*Trading Psychology & Emotional Intelligence Platform*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/saved-by-the-plates-projects/v0-serenity-pocket-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/BiWkTzA027R)
[![Mobile Ready](https://img.shields.io/badge/Mobile-iOS%20%26%20Android-blue?style=for-the-badge&logo=apple)](./MOBILE_DEPLOYMENT.md)

## Overview

Serenity Pocket is a comprehensive trading psychology and emotional intelligence application designed to help traders develop better habits, track emotions, and make more informed decisions.

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