import * as Sentry from '@sentry/react-native';
import 'expo-dev-client';
import { Stack } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Initialize Sentry
Sentry.init({
  dsn: 'https://9ae2e0a97e9bccdc3c8dd1b19058e034@o4509606458753024.ingest.us.sentry.io/4509606505938944',

  // Only enable debug logging in development
  debug: __DEV__,

  // Enable session tracking
  enableAutoSessionTracking: true,

  // Configure sampling rates
  tracesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in production
  profilesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in production

  // Configure Session Replay (reduced sampling in production)
  replaysSessionSampleRate: __DEV__ ? 0.1 : 0.01, // 10% in dev, 1% in production
  replaysOnErrorSampleRate: 1.0, // Always capture replays on errors

  // Essential integrations
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // Add context data
  sendDefaultPii: true,

  // Environment and release info
  environment: __DEV__ ? 'development' : 'production',

  // Enable Spotlight only in development
  spotlight: __DEV__,
});

// Wrapper component to handle PostHog SSR issues
function PostHogWrapper({ children }: { children: React.ReactNode }) {
  // Only render PostHog on native platforms or when window is available (client-side on web)
  const shouldRenderPostHog = Platform.OS !== 'web' || typeof window !== 'undefined';

  if (shouldRenderPostHog) {
    return (
      <PostHogProvider
        apiKey="phc_rrHDN3z2cwSTdi7mVbApC3XBAIelBYewJy0ugjtIH0O"
        options={{
          host: 'https://us.i.posthog.com',
          enableSessionReplay: true,
        }}
        autocapture={{
          captureTouches: true,
          captureScreens: false,
        }}
      >
        {children}
      </PostHogProvider>
    );
  }

  // Return children without PostHog during SSR
  return <>{children}</>;
}

export default Sentry.wrap(function RootLayout() {
  return (
    <PostHogWrapper>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </PostHogWrapper>
  );
});
