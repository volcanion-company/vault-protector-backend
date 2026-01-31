import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Vault Protector',
  slug: 'vault-protector',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#6750A4',
  },
  ios: {
    bundleIdentifier: 'com.vaultprotector.app',
    buildNumber: '1',
    supportsTablet: true,
    infoPlist: {
      NSFaceIDUsageDescription: 'Use Face ID to unlock your vault',
      NSCameraUsageDescription: 'Scan QR codes for 2FA setup',
      UIBackgroundModes: ['fetch'],
    },
    config: {
      usesNonExemptEncryption: true,
    },
  },
  android: {
    package: 'com.vaultprotector.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#6750A4',
    },
    permissions: ['USE_BIOMETRIC', 'USE_FINGERPRINT'],
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-local-authentication',
  ],
  experiments: {
    typedRoutes: true,
  },
  scheme: 'vaultprotector',
});
