# Mobile Deployment Checklist for Serenity Pocket

## ✅ Pre-Deployment Checks

### 1. App Configuration
- [x] Capacitor installed and configured
- [x] App ID set: `com.shaythegay13.serenitypocket`
- [x] App Name set: "Serenity Pocket"
- [ ] Update version number in package.json before each release

### 2. Required Assets

#### App Icons
- [ ] Create app icons for both iOS and Android
  - iOS: Multiple sizes (20x20 to 1024x1024)
  - Android: Multiple densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] Use `npx capacitor-assets generate` to auto-generate icons

#### Splash Screen
- [x] Splash screen configured in capacitor.config.ts
- [ ] Create splash screen images (2732x2732 for iOS, various for Android)

#### App Store Assets
- [ ] Screenshots (multiple device sizes)
- [ ] App preview videos (optional but recommended)
- [ ] Privacy policy URL
- [ ] Terms of service URL

### 3. Platform-Specific Setup

#### iOS (Apple App Store)
- [ ] Apple Developer account ($99/year)
- [ ] App Store Connect listing created
- [ ] Bundle identifier matches: `com.shaythegay13.serenitypocket`
- [ ] Signing certificates and provisioning profiles
- [ ] App Store screenshots and descriptions
- [ ] Privacy manifest file (required by Apple)

#### Android (Google Play Store)
- [ ] Google Play Console account ($25 one-time)
- [ ] App signing key generated
- [ ] Store listing created
- [ ] Privacy policy posted online
- [ ] Google Play screenshots and descriptions

### 4. Testing

#### Mobile-Specific Testing
- [ ] Test on actual iOS device (not just simulator)
- [ ] Test on actual Android device (not just emulator)
- [ ] Test all touch interactions
- [ ] Test keyboard input on mobile
- [ ] Test landscape and portrait orientations
- [ ] Test on various screen sizes (small phones, tablets)

#### Features to Test
- [x] Emotion circle selection (touch-friendly)
- [x] Survey flow with "Already Have an Account?" button
- [ ] Authentication (Supabase works on mobile)
- [ ] Data persistence (localStorage + Supabase)
- [ ] Offline functionality (if applicable)
- [ ] Push notifications (if implementing)

### 5. Performance Optimization
- [x] Images set to unoptimized (good for mobile)
- [ ] Test app size (should be < 100MB ideally)
- [ ] Test load times on slow connections
- [ ] Verify no memory leaks
- [ ] Check battery usage

### 6. Privacy & Security
- [ ] Review data collection practices
- [ ] Create privacy policy document
- [ ] Implement data deletion requests (GDPR/CCPA compliance)
- [ ] Ensure HTTPS for all API calls
- [ ] Review third-party services (Supabase, etc.)

### 7. Build Commands

#### Build for iOS
```bash
npm run mobile:build:ios
# This will:
# 1. Build the Next.js app with static export
# 2. Sync to iOS project
# 3. Open Xcode
```

#### Build for Android
```bash
npm run mobile:build:android
# This will:
# 1. Build the Next.js app with static export
# 2. Sync to Android project
# 3. Open Android Studio
```

#### Or build both
```bash
npm run build:mobile
npx cap sync
```

### 8. Store Submission

#### iOS Submission Steps
1. Open project in Xcode (`npm run cap:open:ios`)
2. Update version and build number
3. Archive the app (Product > Archive)
4. Upload to App Store Connect
5. Fill out metadata in App Store Connect
6. Submit for review

#### Android Submission Steps
1. Open project in Android Studio (`npm run cap:open:android`)
2. Update version code and version name
3. Build signed APK/AAB (Build > Generate Signed Bundle/APK)
4. Upload to Google Play Console
5. Fill out store listing
6. Submit for review

### 9. Known Mobile-Friendly Features
- ✅ Responsive grid layout (`grid-cols-2 md:grid-cols-3`)
- ✅ Touch-friendly button sizes (aspect-square circles)
- ✅ Mobile-first Tailwind classes
- ✅ Circle-packing geometry works on all screen sizes
- ✅ localStorage works on mobile
- ✅ Supabase authentication works on mobile
- ✅ No fixed pixel widths that break on mobile

### 10. Post-Launch
- [ ] Monitor crash reports
- [ ] Monitor user reviews
- [ ] Set up analytics (if desired)
- [ ] Plan for updates and maintenance
- [ ] Respond to user feedback

## 🚀 Quick Start Commands

```bash
# 1. Initialize Capacitor (if not done)
npm run cap:init

# 2. Add platforms
npm run cap:add:ios
npm run cap:add:android

# 3. Build and sync
npm run mobile:build

# 4. Open in native IDE
npm run cap:open:ios      # For iOS
npm run cap:open:android  # For Android
```

## 📱 Mobile Testing on Device

### iOS
1. Connect iPhone via USB
2. Open in Xcode
3. Select your device as target
4. Click Run (Cmd+R)

### Android
1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect via USB
4. Open in Android Studio
5. Select your device and click Run

## ⚠️ Important Notes

- **All recent UI changes are mobile-compatible**
- Circle borders and positioning use responsive units
- Touch targets are appropriately sized
- No desktop-only features were added

## 🔧 Known Issues to Address

None identified in recent changes! All modifications are mobile-friendly.
