# Mobile App Quick Start Guide

Get your Serenity Pocket mobile apps up and running quickly!

## Prerequisites

- Node.js 18+
- For iOS: macOS with Xcode
- For Android: Android Studio
- Supabase account configured

## Quick Setup (5 Minutes)

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure Your App

Edit `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.yourcompany.serenity',  // ⚠️ Change this!
  appName: 'Serenity Pocket',          // ⚠️ Change this!
  webDir: 'out',
  // ...
};
```

### 3. Build Web App

```bash
npm run build:mobile
```

### 4. Choose Your Platform

#### iOS

```bash
# Add iOS platform
npm run cap:add:ios

# Open in Xcode
npm run cap:open:ios
```

In Xcode:
1. Select your Team (Signing & Capabilities)
2. Choose a simulator or device
3. Click Run ▶️

#### Android

```bash
# Add Android platform
npm run cap:add:android

# Open in Android Studio
npm run cap:open:android
```

In Android Studio:
1. Wait for Gradle sync
2. Choose an emulator or device
3. Click Run ▶️

## That's It! 🎉

Your app should now be running on the simulator/emulator.

## Common Next Steps

### Add App Icons

1. Create `icon.png` (1024x1024 px)
2. Create `splash.png` (2732x2732 px)
3. Place in `resources/` folder
4. Run `npm run cap:sync`

### Update After Code Changes

```bash
npm run build:mobile && npm run cap:sync
```

Then re-run the app in Xcode/Android Studio.

### Test on Real Device

**iOS:**
1. Connect iPhone via USB
2. Select it in Xcode device dropdown
3. Click Run ▶️
4. Trust the developer on your iPhone (Settings → General → VPN & Device Management)

**Android:**
1. Enable Developer Mode on your phone (tap Build Number 7 times)
2. Enable USB Debugging (Settings → Developer Options)
3. Connect via USB
4. Select it in Android Studio
5. Click Run ▶️

## Troubleshooting

### "No provisioning profiles found" (iOS)
- Select your Apple Developer Team in Xcode under Signing & Capabilities
- Let Xcode automatically manage signing

### Blank white screen
- Check that `npm run build:mobile` completed successfully
- Verify `webDir: 'out'` in `capacitor.config.ts`
- Check browser console for errors (Safari Web Inspector for iOS)

### Build errors
```bash
# Clear everything and start fresh
rm -rf node_modules package-lock.json
rm -rf ios android
npm install --legacy-peer-deps
npm run build:mobile
npm run cap:add:ios
npm run cap:add:android
```

## Need More Details?

See the comprehensive guide: **[MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md)**

## Essential Commands Reference

```bash
# Build web app for mobile
npm run build:mobile

# Add platforms (run once)
npm run cap:add:ios
npm run cap:add:android

# Sync web code to native apps
npm run cap:sync

# Open in IDEs
npm run cap:open:ios
npm run cap:open:android

# All-in-one: build + sync + open
npm run mobile:build:ios
npm run mobile:build:android
```

---

**Ready to ship to the App Stores?** Follow the full deployment guide in [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md).
