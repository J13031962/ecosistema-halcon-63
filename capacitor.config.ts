import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teleguardia.halcon',
  appName: 'Halcón Teleguardia',
  webDir: 'dist',
  server: {
    // Para desarrollo apunta a tu servidor
    // Para producción comenta estas líneas
    // url: 'https://tu-servidor.com',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1f2e',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#3b82f6'
    },
    Camera: {
      permissions: ['camera']
    },
    Geolocation: {
      permissions: ['location']
    }
  }
};

export default config;
