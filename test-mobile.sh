#!/bin/bash

# Serenity Pocket - Quick Test Script
# This script helps you quickly test your mobile app

echo "======================================"
echo "Serenity Pocket Mobile - Quick Test"
echo "======================================"
echo ""

# Check if capacitor.config.ts has been customized
if grep -q "com.serenity.pocketapp" capacitor.config.ts; then
    echo "⚠️  WARNING: You haven't customized your app ID yet!"
    echo "Please edit capacitor.config.ts and change:"
    echo "  appId: 'com.serenity.pocketapp'"
    echo "to something unique like:"
    echo "  appId: 'com.yourname.serenitypocket'"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to stop and edit..."
fi

echo ""
echo "What would you like to test?"
echo "1) iOS (requires macOS + Xcode)"
echo "2) Android (requires Android Studio)"
echo ""
read -p "Enter 1 or 2: " choice

case $choice in
    1)
        echo ""
        echo "Building for iOS..."
        echo ""

        # Build the web app
        echo "Step 1/4: Building web app..."
        BUILD_MODE=mobile npm run build || { echo "Build failed!"; exit 1; }

        # Add iOS platform if not exists
        if [ ! -d "ios" ]; then
            echo ""
            echo "Step 2/4: Adding iOS platform..."
            npx cap add ios || { echo "Failed to add iOS platform!"; exit 1; }
        else
            echo ""
            echo "Step 2/4: iOS platform already exists, skipping..."
        fi

        # Sync
        echo ""
        echo "Step 3/4: Syncing web code to iOS..."
        npx cap sync ios || { echo "Sync failed!"; exit 1; }

        # Open Xcode
        echo ""
        echo "Step 4/4: Opening Xcode..."
        echo ""
        echo "Next steps in Xcode:"
        echo "1. Wait for it to finish loading"
        echo "2. Select a simulator from the top (e.g., iPhone 15 Pro)"
        echo "3. Click the Play button (▶️) or press Cmd+R"
        echo "4. Your app should launch in the simulator!"
        echo ""
        read -p "Press Enter to open Xcode..."
        npx cap open ios
        ;;

    2)
        echo ""
        echo "Building for Android..."
        echo ""

        # Build the web app
        echo "Step 1/4: Building web app..."
        BUILD_MODE=mobile npm run build || { echo "Build failed!"; exit 1; }

        # Add Android platform if not exists
        if [ ! -d "android" ]; then
            echo ""
            echo "Step 2/4: Adding Android platform..."
            npx cap add android || { echo "Failed to add Android platform!"; exit 1; }
        else
            echo ""
            echo "Step 2/4: Android platform already exists, skipping..."
        fi

        # Sync
        echo ""
        echo "Step 3/4: Syncing web code to Android..."
        npx cap sync android || { echo "Sync failed!"; exit 1; }

        # Open Android Studio
        echo ""
        echo "Step 4/4: Opening Android Studio..."
        echo ""
        echo "Next steps in Android Studio:"
        echo "1. Wait for Gradle sync to complete (may take a few minutes)"
        echo "2. Create an emulator if needed (Tools > Device Manager)"
        echo "3. Select a device from the top dropdown"
        echo "4. Click the Run button (▶️) or press Ctrl+R (Cmd+R on Mac)"
        echo "5. Your app should launch in the emulator!"
        echo ""
        read -p "Press Enter to open Android Studio..."
        npx cap open android
        ;;

    *)
        echo "Invalid choice. Please run the script again and enter 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "Happy testing! 🎉"
echo "======================================"
