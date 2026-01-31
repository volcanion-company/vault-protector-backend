/**
 * @file Card Component - Container with elevation
 * @description Material Design 3 card component
 */

import React from 'react';
import { StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Card as PaperCard, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Card mode - 'elevated' only as per react-native-paper */
  mode?: 'elevated';
  /** Press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Card elevation */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  /** Custom style */
  style?: ViewStyle;
  /** Content style */
  contentStyle?: ViewStyle;
  /** Test ID */
  testID?: string;
}

export function Card({
  children,
  mode = 'elevated',
  onPress,
  onLongPress,
  disabled = false,
  elevation = 1,
  style,
  contentStyle,
  testID,
}: CardProps) {
  const theme = useTheme<MD3Theme>();

  return (
    <PaperCard
      mode={mode}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      elevation={elevation}
      style={[styles.card, style]}
      contentStyle={contentStyle}
      testID={testID}
    >
      {children}
    </PaperCard>
  );
}

// Card sub-components
export const CardTitle = PaperCard.Title;
export const CardContent = PaperCard.Content;
export const CardActions = PaperCard.Actions;
export const CardCover = PaperCard.Cover;

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 0,
  },
});

export default Card;
