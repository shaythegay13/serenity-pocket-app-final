# App Resources

This directory contains resources for building mobile apps (iOS and Android).

## Required Assets

### App Icon
- **File**: `icon.png`
- **Size**: 1024x1024 px
- **Format**: PNG with transparency
- **Purpose**: Used to generate all app icon sizes for iOS and Android

### Splash Screen
- **File**: `splash.png`
- **Size**: 2732x2732 px (recommended)
- **Format**: PNG with transparency
- **Purpose**: Used to generate splash screens for all device sizes

## How to Add Your Assets

1. Create your app icon (1024x1024 px PNG)
2. Create your splash screen (2732x2732 px PNG)
3. Place both files in this `resources/` directory
4. The files should be named exactly:
   - `icon.png`
   - `splash.png`

## Generating Assets

Once you have your icon and splash screen in place, Capacitor will automatically generate
all the required sizes when you run:

```bash
npm run cap:sync
```

Or you can use additional tools like:
- [@capacitor/assets](https://github.com/ionic-team/capacitor-assets) - Official asset generator
- [Capacitor Icon Generator](https://capacitorjs.com/docs/guides/splash-screens-and-icons)

## Asset Generation with @capacitor/assets

For automated asset generation from your source files:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

This will automatically generate all required icon and splash screen sizes for both platforms.

## Design Guidelines

### Icon Design
- Use a simple, recognizable design
- Avoid text (it may not be readable at small sizes)
- Use high contrast
- Center your design in the safe area (80% of canvas)
- iOS will add rounded corners automatically

### Splash Screen Design
- Keep important content in the center
- Use solid background or subtle gradients
- Match your app's branding
- Account for different screen aspect ratios

## Platform-Specific Notes

### iOS
- Icons are automatically rounded by iOS
- Splash screens are shown briefly during app launch
- Must support both light and dark modes (optional but recommended)

### Android
- Icons can be any shape (system may apply masks)
- Adaptive icons are recommended for Android 8.0+
- Splash screens use Android 12+ Splash Screen API

## Useful Resources
- [iOS Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Icon Design Guidelines](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Capacitor Assets Documentation](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
