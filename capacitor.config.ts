import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6a30b8dba47e48deab01b3c0a8a2d9f1',
  appName: 'pdf-to-sheets-finances',
  webDir: 'dist',
  server: {
    url: 'https://6a30b8db-a47e-48de-ab01-b3c0a8a2d9f1.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#8b5cf6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;