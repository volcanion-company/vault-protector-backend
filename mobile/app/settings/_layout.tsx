/**
 * @file Settings Stack Layout
 * @description Stack navigator for settings-related screens
 */

import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from '@/i18n';

export default function SettingsLayout() {
  const theme = useTheme<MD3Theme>();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="privacy-policy"
        options={{
          title: t('settings.privacyPolicy'),
        }}
      />
      <Stack.Screen
        name="terms-of-service"
        options={{
          title: t('settings.termsOfService'),
        }}
      />
    </Stack>
  );
}
