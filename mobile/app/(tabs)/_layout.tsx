/**
 * @file Tabs Layout - Bottom tab navigation
 * @description Main app tabs: Vault, Generator, Settings
 */

import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MD3Theme } from 'react-native-paper';

import { useTranslation } from '@/i18n';

export default function TabsLayout() {
  const theme = useTheme<MD3Theme>();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      }}
    >
      <Tabs.Screen
        name="vault"
        options={{
          title: t('tabs.vault'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-lock" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="generator"
        options={{
          title: t('tabs.generator'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="key-plus" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
