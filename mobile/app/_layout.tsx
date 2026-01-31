/**
 * @file Root Layout - App entry point with providers
 * @description Main app layout with theme provider, query client, and navigation
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, adaptNavigationTheme } from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/stores/settingsStore';
import { lightTheme, darkTheme } from '@/config/theme';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Adapt themes for React Navigation
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

export default function RootLayout() {
  const { themeMode } = useSettingsStore();

  // Load fonts
  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
  });

  // Hide splash screen when ready
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Determine theme based on settings
  const isDark = themeMode === 'dark';
  const paperTheme = isDark ? darkTheme : lightTheme;
  const navigationTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, ...darkTheme.colors } }
    : { ...LightTheme, colors: { ...LightTheme.colors, ...lightTheme.colors } };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={paperTheme}>
            <ThemeProvider value={navigationTheme}>
              <StatusBar style={isDark ? 'light' : 'dark'} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </ThemeProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
