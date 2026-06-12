import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.examprep.bharat',
  appName: 'ExamPrep Bharat',
  webDir: 'out',
  server: {
    // No live-reload URL — use static files
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#EA580C'
  }
};

export default config;
