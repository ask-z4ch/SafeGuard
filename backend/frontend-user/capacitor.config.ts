import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safeguard.user',
  appName: 'Safeguard Companion',
  webDir: 'build',
  android: {
    allowMixedContent: true,
  },
  allowNavigation: ['safeguard-c7n8.onrender.com', 'safeguard-plum.vercel.app'],
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
