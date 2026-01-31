/**
 * @file Vault Stack Layout
 * @description Stack navigator for vault-related screens
 */

import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from '@/i18n';

export default function VaultLayout() {
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
        name="add"
        options={{
          title: t('vault.addItem'),
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: t('vault.itemDetails'),
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: t('vault.editItem'),
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
