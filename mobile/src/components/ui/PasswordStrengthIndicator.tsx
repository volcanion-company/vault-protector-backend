/**
 * @file PasswordStrengthIndicator - Visual password strength meter
 * @description Shows password strength with colored bars and label
 */

import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { calculatePasswordStrength } from '@/services/crypto';

export interface PasswordStrengthIndicatorProps {
  /** Password to analyze */
  password: string;
  /** Show feedback messages */
  showFeedback?: boolean;
  /** Container style */
  style?: ViewStyle;
}

const STRENGTH_COLORS = {
  weak: '#F44336',
  fair: '#FF9800',
  good: '#FFC107',
  strong: '#8BC34A',
  excellent: '#4CAF50',
};

const STRENGTH_LABELS = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
  excellent: 'Excellent',
};

export function PasswordStrengthIndicator({
  password,
  showFeedback = false,
  style,
}: PasswordStrengthIndicatorProps) {
  const theme = useTheme<MD3Theme>();

  const strength = useMemo(() => {
    if (!password) {
      return { score: 0, level: 'weak' as const, feedback: [] };
    }
    return calculatePasswordStrength(password);
  }, [password]);

  const barCount = 5;
  const filledBars = Math.ceil((strength.score / 100) * barCount);
  const color = STRENGTH_COLORS[strength.level];

  if (!password) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.barsContainer}>
        {Array.from({ length: barCount }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor:
                  index < filledBars ? color : theme.colors.surfaceVariant,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.labelContainer}>
        <Text
          variant="labelSmall"
          style={[styles.label, { color }]}
        >
          {STRENGTH_LABELS[strength.level]}
        </Text>
        <Text
          variant="labelSmall"
          style={[styles.score, { color: theme.colors.onSurfaceVariant }]}
        >
          {strength.score}%
        </Text>
      </View>

      {showFeedback && strength.feedback.length > 0 && (
        <View style={styles.feedbackContainer}>
          {strength.feedback.map((message, index) => (
            <Text
              key={index}
              variant="bodySmall"
              style={[styles.feedback, { color: theme.colors.onSurfaceVariant }]}
            >
              • {message}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontWeight: '600',
  },
  score: {},
  feedbackContainer: {
    marginTop: 8,
  },
  feedback: {
    marginBottom: 2,
  },
});

export default PasswordStrengthIndicator;
