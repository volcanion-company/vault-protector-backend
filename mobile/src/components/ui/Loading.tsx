/**
 * @file Loading Component - Loading indicators
 * @description Full screen and inline loading spinners
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export interface LoadingProps {
  /** Loading message */
  message?: string;
  /** Indicator size */
  size?: 'small' | 'large';
  /** Full screen overlay */
  fullScreen?: boolean;
  /** Container style */
  style?: ViewStyle;
}

export function Loading({
  message,
  size = 'large',
  fullScreen = false,
  style,
}: LoadingProps) {
  const theme = useTheme<MD3Theme>();

  const content = (
    <View style={[styles.content, style]}>
      <ActivityIndicator
        animating
        size={size}
        color={theme.colors.primary}
      />
      {message && (
        <Text
          variant="bodyMedium"
          style={[styles.message, { color: theme.colors.onSurface }]}
        >
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreen,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});

export default Loading;
