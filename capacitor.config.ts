import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shaythegay13.playmindlabs',
  appName: 'PlayMind Labs',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // For development, you can use your local server
    // url: 'http://localhost:3000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
