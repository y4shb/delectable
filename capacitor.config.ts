import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.delectable.ios',
  appName: 'Delectable',
  webDir: 'out',
  server: {
    // In dev, use live reload from Next.js dev server
    ...(process.env.NODE_ENV === 'development' ? {
      url: 'http://localhost:3000',
      cleartext: true,
    } : {}),
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#FFFFFF',
    preferredContentMode: 'mobile',
    scheme: 'Delectable',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFF5F0',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#F24D4F',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
