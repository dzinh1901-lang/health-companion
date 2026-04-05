import React, { lazy, Suspense } from 'react';
import { Platform, View } from 'react-native';
import { Redirect } from 'expo-router';

// Lazily load the web-only landing page to avoid bundling
// web-only dependencies (framer-motion, lucide-react) in native builds.
const LandingPage = Platform.OS === 'web' ? lazy(() => import('./landing')) : null;

// On web, show the marketing landing page.
// On native, redirect to the main tab navigator.
export default function RootIndex() {
  if (Platform.OS === 'web' && LandingPage) {
    return (
      <Suspense fallback={<View />}>
        <LandingPage />
      </Suspense>
    );
  }
  return <Redirect href="/(tabs)" />;
}
