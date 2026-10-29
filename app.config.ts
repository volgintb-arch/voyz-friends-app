import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'Voyz Friends', slug: 'voyz-friends', version: '0.1.0', scheme: 'voyzfriends',
  plugins: ['expo-router'], orientation: 'default', userInterfaceStyle: 'light', icon: './assets/voyz-icon.png',
  ios: { supportsTablet: true, bundleIdentifier: 'com.voyz.friends.demo' },
  android: { package: 'com.voyz.friends.demo', adaptiveIcon: { foregroundImage: './assets/voyz-icon.png', backgroundColor: '#D5FF00' }, softwareKeyboardLayoutMode: 'resize', predictiveBackGestureEnabled: true },
  web: { bundler: 'metro', output: 'single', name: 'Voyz Friends', favicon: './assets/voyz-icon.png' },
  experiments: { baseUrl: process.env.EXPO_BASE_URL || '' },
  extra: { demoMode: true, integrationsConnected: false },
};
export default config;
