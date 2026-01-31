/**
 * @file EmptyState Component - Placeholder for empty lists
 * @description Displays icon, title, and description when content is empty
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MD3Theme } from 'react-native-paper';

import { Button } from './Button';

export interface EmptyStateProps {
  /** Icon name (MaterialCommunityIcons) */
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button handler */
  onAction?: () => void;
  /** Container style */
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme<MD3Theme>();

  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons
        name={icon}
        size={64}
        color={theme.colors.onSurfaceVariant}
        style={styles.icon}
      />

      <Text
        variant="titleMedium"
        style={[styles.title, { color: theme.colors.onSurface }]}
      >
        {title}
      </Text>

      {description && (
        <Text
          variant="bodyMedium"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.button}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
});

export default EmptyState;
