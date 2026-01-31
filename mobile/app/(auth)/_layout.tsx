/**
 * @file Auth Layout - Authentication screens layout
 * @description Stack navigation for auth screens
 */

import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from '@/i18n';

export default function AuthLayout() {
  const theme = useTheme<MD3Theme>();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: t('auth.login'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: t('auth.createAccount'),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="unlock"
        options={{
          title: t('auth.unlockVault'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: t('auth.forgotPasswordTitle'),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="set-master-password"
        options={{
          title: t('auth.setMasterPasswordTitle'),
          headerShown: true,
          headerBackVisible: false, // Can't go back - must set Master Password
        }}
      />
    </Stack>
  );
}
