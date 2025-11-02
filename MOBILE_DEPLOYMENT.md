# Mobile App Deployment Guide

This comprehensive guide will walk you through converting the Serenity Pocket web app into native iOS and Android applications that can be published to the Apple App Store and Google Play Store.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [iOS Development](#ios-development)
- [Android Development](#android-development)
- [Building for Production](#building-for-production)
- [App Store Submission](#app-store-submission)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project uses **Capacitor** by Ionic to wrap the Next.js web application in a native container. This approach allows you to:

- ✅ Keep your existing React/Next.js codebase
- ✅ Access native device features (camera, push notifications, etc.)
- ✅ Publish to both iOS App Store and Google Play Store
- ✅ Maintain a single codebase for web and mobile

### Architecture

```
Web App (Next.js) → Static Export → Capacitor → Native iOS/Android Apps
```

---

## Prerequisites

### For All Platforms

- **Node.js** 18 or higher
- **npm** or **pnpm**
- **Git**
- A **Supabase** account with your project configured

### For iOS Development

- **macOS** (required for iOS development)
- **Xcode** 14 or higher (download from Mac App Store)
- **CocoaPods** (install via: `sudo gem install cocoapods`)
- **Apple Developer Account** ($99/year for app distribution)

### For Android Development

- **Android Studio** (download from [developer.android.com](https://developer.android.com/studio))
- **Java Development Kit (JDK)** 11 or higher
- **Android SDK** (installed with Android Studio)
- **Google Play Developer Account** ($25 one-time fee)

---

## Initial Setup

### 1. Install Dependencies

All Capacitor dependencies are already included in `package.json`. If you need to reinstall:

```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables

Create `.env.local` with your Supabase credentials:

```bash
cp ENV_TEMPLATE.txt .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Customize App Configuration

Edit `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.yourcompany.serenity',  // Change this to your unique identifier
  appName: 'Serenity Pocket',         // Change this to your app name
  webDir: 'out',
  // ... rest of config
};
```

**Important**: The `appId` must be:
- Unique (reverse domain format: `com.company.appname`)
- Lowercase letters, numbers, and periods only
- Same across iOS and Android for the same app

### 4. Add App Icons and Splash Screens

1. Create your app icon (1024x1024 px PNG)
2. Create your splash screen (2732x2732 px PNG)
3. Place them in the `resources/` folder as:
   - `resources/icon.png`
   - `resources/splash.png`

See `resources/README.md` for detailed guidelines.

### 5. Build the Web App

Build the Next.js app for mobile:

```bash
npm run build:mobile
```

This creates a static export in the `out/` directory.

---

## iOS Development

### Setup iOS Platform

1. **Add iOS platform**:
   ```bash
   npm run cap:add:ios
   ```

   This creates an `ios/` directory with an Xcode project.

2. **Sync your web code**:
   ```bash
   npm run cap:sync:ios
   ```

### Open in Xcode

```bash
npm run cap:open:ios
```

Or manually:
```bash
open ios/App/App.xcworkspace
```

### Configure in Xcode

1. **Select your Team**:
   - Click on the project in the navigator
   - Select "App" target
   - Go to "Signing & Capabilities"
   - Select your Apple Developer Team

2. **Update Bundle Identifier**:
   - Should match your `appId` in `capacitor.config.ts`
   - Format: `com.yourcompany.serenity`

3. **Set Deployment Target**:
   - Recommended: iOS 13.0 or higher
   - Set in "General" tab under "Minimum Deployments"

4. **Configure App Information**:
   - Display Name: "Serenity Pocket"
   - Version: 1.0.0
   - Build: 1

### Test on iOS Simulator

1. Select a simulator from the device dropdown (e.g., "iPhone 15 Pro")
2. Click the Play button (▶️) or press `Cmd+R`
3. Wait for the app to build and launch

### Test on Physical Device

1. Connect your iPhone via USB
2. Trust the computer on your iPhone if prompted
3. Select your device from the device dropdown in Xcode
4. Click the Play button (▶️)
5. On your iPhone, go to Settings → General → VPN & Device Management
6. Trust your developer certificate

### Add Native Capabilities (Optional)

To use native features like Camera, Push Notifications, etc.:

1. In Xcode, go to "Signing & Capabilities"
2. Click "+ Capability"
3. Add required capabilities:
   - Push Notifications
   - Background Modes
   - Camera Usage
   - Photo Library Access
   - etc.

4. Update `Info.plist` with usage descriptions:
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>We need camera access to take photos</string>
   <key>NSPhotoLibraryUsageDescription</key>
   <string>We need photo library access to select images</string>
   ```

---

## Android Development

### Setup Android Platform

1. **Add Android platform**:
   ```bash
   npm run cap:add:android
   ```

   This creates an `android/` directory with an Android Studio project.

2. **Sync your web code**:
   ```bash
   npm run cap:sync:android
   ```

### Open in Android Studio

```bash
npm run cap:open:android
```

Or manually:
```bash
open -a "Android Studio" android/
```

### Configure in Android Studio

1. **Update Package Name**:
   - Open `android/app/build.gradle`
   - Verify `applicationId` matches your `appId`

2. **Update App Information**:
   - Edit `android/app/src/main/res/values/strings.xml`:
   ```xml
   <resources>
       <string name="app_name">Serenity Pocket</string>
       <string name="title_activity_main">Serenity Pocket</string>
       <string name="package_name">com.yourcompany.serenity</string>
   </resources>
   ```

3. **Set Version Information**:
   - In `android/app/build.gradle`:
   ```gradle
   android {
       defaultConfig {
           versionCode 1
           versionName "1.0.0"
           minSdkVersion 22
           targetSdkVersion 34
       }
   }
   ```

### Test on Android Emulator

1. Open AVD Manager (Tools → Device Manager)
2. Create a new virtual device if needed
3. Click the Play button (▶️) next to your virtual device
4. In Android Studio, click Run (▶️) or press `Ctrl+R` (Windows/Linux) / `Cmd+R` (Mac)

### Test on Physical Device

1. Enable Developer Options on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Connect your device via USB
4. Select your device from the device dropdown
5. Click Run (▶️)

### Add Permissions (Optional)

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

---

## Building for Production

### iOS Production Build

1. **Archive the App**:
   - In Xcode, select "Any iOS Device" from the device dropdown
   - Go to Product → Archive
   - Wait for the build to complete

2. **Prepare for Upload**:
   - In the Archives window, click "Distribute App"
   - Select "App Store Connect"
   - Follow the wizard to upload

3. **App Store Connect**:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create a new app listing
   - Upload screenshots, descriptions, etc.
   - Submit for review

### Android Production Build

1. **Generate Signing Key**:
   ```bash
   cd android/app
   keytool -genkey -v -keystore serenity-release-key.keystore -alias serenity -keyalg RSA -keysize 2048 -validity 10000
   ```

   Save the keystore file and passwords securely!

2. **Configure Signing**:
   - Create `android/key.properties`:
   ```properties
   storePassword=your-keystore-password
   keyPassword=your-key-password
   keyAlias=serenity
   storeFile=app/serenity-release-key.keystore
   ```

   - Update `android/app/build.gradle`:
   ```gradle
   def keystoreProperties = new Properties()
   def keystorePropertiesFile = rootProject.file('key.properties')
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }

   android {
       signingConfigs {
           release {
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
               storeFile file(keystoreProperties['storeFile'])
               storePassword keystoreProperties['storePassword']
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Build Release APK/Bundle**:
   ```bash
   cd android
   ./gradlew assembleRelease    # For APK
   ./gradlew bundleRelease      # For App Bundle (recommended)
   ```

   Output location:
   - APK: `android/app/build/outputs/apk/release/app-release.apk`
   - Bundle: `android/app/build/outputs/bundle/release/app-release.aab`

4. **Upload to Google Play**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Create a new app
   - Upload the App Bundle (`.aab` file)
   - Fill in store listing, screenshots, etc.
   - Submit for review

---

## App Store Submission

### iOS App Store Requirements

**App Store Connect Checklist**:
- [ ] App name and subtitle
- [ ] App icon (1024x1024 px)
- [ ] Screenshots for all device sizes:
  - 6.7" (iPhone 14 Pro Max): 1290x2796 px
  - 6.5" (iPhone 11 Pro Max): 1242x2688 px
  - 5.5" (iPhone 8 Plus): 1242x2208 px
- [ ] App description and keywords
- [ ] Privacy policy URL (required!)
- [ ] Support URL
- [ ] App category
- [ ] Age rating questionnaire
- [ ] Pricing and availability

**Required Legal Documents**:
- Privacy Policy (must be hosted online)
- Terms of Service (recommended)

**Review Tips**:
- Test thoroughly before submission
- Clearly explain any permission requests
- Provide test account credentials if needed
- First review typically takes 24-48 hours

### Google Play Store Requirements

**Google Play Console Checklist**:
- [ ] App name (max 30 characters)
- [ ] Short description (max 80 characters)
- [ ] Full description (max 4000 characters)
- [ ] App icon (512x512 px)
- [ ] Feature graphic (1024x500 px)
- [ ] Screenshots (at least 2):
  - Phone: 16:9 or 9:16, min 320px
  - Tablet: 16:9 or 9:16, min 320px (if tablet support)
- [ ] Privacy policy URL (required!)
- [ ] Content rating questionnaire
- [ ] App category
- [ ] Pricing and distribution

**Required Legal Documents**:
- Privacy Policy (must be hosted online)
- Data Safety Form (explain data collection)

**Review Tips**:
- First review can take up to 7 days
- Subsequent updates usually faster (1-3 days)
- Use internal testing track first
- Provide clear app description and screenshots

---

## Updating Your App

### Make Code Changes

1. Update your Next.js code
2. Test in the browser: `npm run dev`
3. Build for mobile: `npm run build:mobile`
4. Sync with native projects: `npm run cap:sync`

### Update iOS

1. Open in Xcode: `npm run cap:open:ios`
2. Increment version/build number
3. Test on simulator/device
4. Archive and upload to App Store Connect

### Update Android

1. Open in Android Studio: `npm run cap:open:android`
2. Update `versionCode` and `versionName` in `build.gradle`
3. Test on emulator/device
4. Build release bundle: `./gradlew bundleRelease`
5. Upload to Google Play Console

---

## Troubleshooting

### Common Issues

#### Build Fails with "Module not found"
```bash
# Clear caches and rebuild
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build:mobile
```

#### iOS: "No profiles for 'com.yourapp' were found"
- Make sure you've selected your Team in Xcode
- Create an App ID in Apple Developer Portal
- Let Xcode manage signing automatically

#### Android: "SDK location not found"
- Open Android Studio → Preferences → System Settings → Android SDK
- Note the SDK location path
- Create `android/local.properties`:
  ```
  sdk.dir=/Users/yourname/Library/Android/sdk
  ```

#### App shows blank white screen
- Check browser console in dev tools
- Verify `webDir: 'out'` in `capacitor.config.ts`
- Ensure `npm run build:mobile` completed successfully
- Check that all environment variables are set

#### Supabase auth not working in mobile app
- Update Supabase redirect URLs to include:
  - `capacitor://localhost`
  - `com.yourcompany.serenity://`
- Update your app's URL schemes in Xcode/Android Studio

### Getting Help

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Community Forum](https://forum.ionicframework.com/c/capacitor)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/capacitor) with tag `capacitor`

---

## Next Steps

After successfully building your apps:

1. **Beta Testing**:
   - iOS: Use TestFlight for beta testing
   - Android: Use Google Play Internal Testing or Closed Testing tracks

2. **Analytics**:
   - Consider adding analytics (Firebase, Mixpanel, etc.)
   - Track user engagement and crashes

3. **Push Notifications**:
   - Set up Firebase Cloud Messaging (FCM) for both platforms
   - Install `@capacitor/push-notifications` plugin

4. **Native Features**:
   - Explore [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
   - Add features like Camera, Geolocation, Haptics, etc.

5. **Performance**:
   - Monitor app size and loading times
   - Optimize images and assets
   - Consider code splitting for large apps

---

## Quick Reference

### Essential Commands

```bash
# Build web app for mobile
npm run build:mobile

# Sync web code to native projects
npm run cap:sync

# Open in Xcode
npm run cap:open:ios

# Open in Android Studio
npm run cap:open:android

# Build and sync iOS
npm run mobile:build:ios

# Build and sync Android
npm run mobile:build:android
```

### File Locations

- **Capacitor Config**: `capacitor.config.ts`
- **iOS Project**: `ios/App/App.xcworkspace`
- **Android Project**: `android/`
- **Web Build Output**: `out/`
- **App Resources**: `resources/`

### Important URLs

- [Apple Developer](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Ionic Forum](https://forum.ionicframework.com)

---

## Support

For project-specific questions, please open an issue on GitHub.

For Capacitor questions, visit the [Capacitor Community Forum](https://forum.ionicframework.com/c/capacitor).

**Good luck with your app launch! 🚀**
