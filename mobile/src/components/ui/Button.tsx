/**
 * @file Button Component - Customizable button with variants
 * @description Material Design 3 button component
 */

import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Button as PaperButton, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export interface ButtonProps {
  /** Button label text */
  children: React.ReactNode;
  /** Button variant */
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  /** Press handler */
  onPress?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Icon to show */
  icon?: string;
  /** Full width button */
  fullWidth?: boolean;
  /** Compact button (less padding) */
  compact?: boolean;
  /** Dark mode for text button */
  dark?: boolean;
  /** Button color */
  buttonColor?: string;
  /** Text color */
  textColor?: string;
  /** Ripple color */
  rippleColor?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Custom label style */
  labelStyle?: TextStyle;
  /** Custom content style */
  contentStyle?: ViewStyle;
  /** Test ID */
  testID?: string;
}

export function Button({
  children,
  mode = 'contained',
  onPress,
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  compact = false,
  dark,
  buttonColor,
  textColor,
  rippleColor,
  style,
  labelStyle,
  contentStyle,
  testID,
}: ButtonProps) {
  const theme = useTheme<MD3Theme>();

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      compact={compact}
      dark={dark}
      buttonColor={buttonColor}
      textColor={textColor}
      rippleColor={rippleColor}
      style={[fullWidth && styles.fullWidth, style]}
      labelStyle={[styles.label, labelStyle]}
      contentStyle={[styles.content, contentStyle]}
      testID={testID}
    >
      {children}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
  },
  content: {
    paddingVertical: 4,
  },
});

export default Button;
