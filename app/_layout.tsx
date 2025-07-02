import 'expo-dev-client';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider } from 'posthog-react-native';

export default function RootLayout() {
  return (
    <PostHogProvider
      apiKey="phc_rrHDN3z2cwSTdi7mVbApC3XBAIelBYewJy0ugjtIH0O"
      options={{
        host: 'https://us.i.posthog.com',
        enableSessionReplay: true,
      }}
      autocapture
    >
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </PostHogProvider>
  );
}