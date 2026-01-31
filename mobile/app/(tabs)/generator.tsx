/**
 * @file Generator Screen - Password generator
 * @description Generate secure passwords with customizable options
 */

import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Text,
  useTheme,
  Surface,
  Switch,
  Divider,
  IconButton,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import type { MD3Theme } from 'react-native-paper';

import { Button, PasswordStrengthIndicator, Card, CardContent } from '@/components/ui';
import { usePasswordGenerator, type GeneratorMode } from '@/hooks/usePasswordGenerator';
import { useClipboard } from '@/hooks/useClipboard';
import { useTranslation } from '@/i18n';

const MODE_OPTIONS = [
  { value: 'password', labelKey: 'generator.password' },
  { value: 'passphrase', labelKey: 'generator.passphrase' },
  { value: 'pin', labelKey: 'generator.pin' },
];

export default function GeneratorScreen() {
  const theme = useTheme<MD3Theme>();
  const { copyPassword, isCopied } = useClipboard();
  const { t } = useTranslation();
  const {
    mode,
    setMode,
    generatedValue,
    strength,
    generate,
    passwordOptions,
    updatePasswordOption,
    passphraseOptions,
    updatePassphraseOption,
    pinLength,
    setPinLength,
  } = usePasswordGenerator();

  // Generate on mount
  useEffect(() => {
    generate();
  }, []);

  // Regenerate when options change
  useEffect(() => {
    generate();
  }, [mode, passwordOptions, passphraseOptions, pinLength]);

  const handleCopy = useCallback(async () => {
    if (generatedValue) {
      await copyPassword(generatedValue);
    }
  }, [generatedValue, copyPassword]);

  const handleRegenerate = useCallback(() => {
    generate();
  }, [generate]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Generated Value Display */}
        <Card style={styles.valueCard}>
          <CardContent>
            <View style={styles.valueContainer}>
              <Text
                variant="titleLarge"
                style={[styles.generatedValue, { color: theme.colors.onSurface }]}
                selectable
              >
                {generatedValue || t('generator.tapRegenerate')}
              </Text>
              <View style={styles.valueActions}>
                <IconButton
                  icon="refresh"
                  size={24}
                  onPress={handleRegenerate}
                  accessibilityLabel={t('generator.regenerate')}
                />
                <IconButton
                  icon={isCopied ? 'check' : 'content-copy'}
                  size={24}
                  onPress={handleCopy}
                  accessibilityLabel={t('generator.copy')}
                />
              </View>
            </View>

            {mode === 'password' && (
              <PasswordStrengthIndicator password={generatedValue} />
            )}
          </CardContent>
        </Card>

        {/* Mode Selector */}
        <SegmentedButtons
          value={mode}
          onValueChange={(value) => setMode(value as GeneratorMode)}
          buttons={MODE_OPTIONS.map(opt => ({ value: opt.value, label: t(opt.labelKey) }))}
          style={styles.modeSelector}
        />

        {/* Options */}
        <Surface style={[styles.optionsCard, { backgroundColor: theme.colors.surface }]}>
          {mode === 'password' && (
            <>
              {/* Length slider */}
              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.length')}</Text>
                <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                  {passwordOptions.length}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={8}
                maximumValue={64}
                step={1}
                value={passwordOptions.length}
                onValueChange={(value) => updatePasswordOption('length', value)}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.surfaceVariant}
                thumbTintColor={theme.colors.primary}
              />

              <Divider style={styles.divider} />

              {/* Character options */}
              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.uppercase')}</Text>
                <Switch
                  value={passwordOptions.uppercase}
                  onValueChange={(value) => updatePasswordOption('uppercase', value)}
                />
              </View>

              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.lowercase')}</Text>
                <Switch
                  value={passwordOptions.lowercase}
                  onValueChange={(value) => updatePasswordOption('lowercase', value)}
                />
              </View>

              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.numbers')}</Text>
                <Switch
                  value={passwordOptions.numbers}
                  onValueChange={(value) => updatePasswordOption('numbers', value)}
                />
              </View>

              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.symbols')}</Text>
                <Switch
                  value={passwordOptions.symbols}
                  onValueChange={(value) => updatePasswordOption('symbols', value)}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.excludeAmbiguous')}</Text>
                <Switch
                  value={passwordOptions.excludeAmbiguous}
                  onValueChange={(value) => updatePasswordOption('excludeAmbiguous', value)}
                />
              </View>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: -8 }}
              >
                {t('generator.excludeAmbiguousHint')}
              </Text>
            </>
          )}

          {mode === 'passphrase' && (
            <>
              {/* Word count slider */}
              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.wordCount')}</Text>
                <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                  {passphraseOptions.wordCount}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={3}
                maximumValue={10}
                step={1}
                value={passphraseOptions.wordCount}
                onValueChange={(value) => updatePassphraseOption('wordCount', value)}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.surfaceVariant}
                thumbTintColor={theme.colors.primary}
              />

              <Divider style={styles.divider} />

              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.capitalizeWords')}</Text>
                <Switch
                  value={passphraseOptions.capitalize}
                  onValueChange={(value) => updatePassphraseOption('capitalize', value)}
                />
              </View>

              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.includeNumber')}</Text>
                <Switch
                  value={passphraseOptions.includeNumber}
                  onValueChange={(value) => updatePassphraseOption('includeNumber', value)}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.separator')}</Text>
                <SegmentedButtons
                  value={passphraseOptions.separator}
                  onValueChange={(value) => updatePassphraseOption('separator', value)}
                  buttons={[
                    { value: '-', label: '-' },
                    { value: '.', label: '.' },
                    { value: '_', label: '_' },
                    { value: ' ', label: '␣' },
                  ]}
                  density="small"
                  style={styles.separatorButtons}
                />
              </View>
            </>
          )}

          {mode === 'pin' && (
            <>
              {/* PIN length slider */}
              <View style={styles.optionRow}>
                <Text variant="bodyLarge">{t('generator.pinLength')}</Text>
                <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                  {pinLength}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={4}
                maximumValue={8}
                step={1}
                value={pinLength}
                onValueChange={setPinLength}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.surfaceVariant}
                thumbTintColor={theme.colors.primary}
              />

              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
              >
                {t('generator.pinWarning')}
              </Text>
            </>
          )}
        </Surface>

        {/* Actions */}
        <View style={styles.actions}>
          <Button mode="contained" onPress={handleCopy} icon="content-copy" fullWidth>
            {isCopied ? t('common.copied') : t('generator.copyToClipboard')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  valueCard: {
    marginBottom: 16,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  generatedValue: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 18,
  },
  valueActions: {
    flexDirection: 'row',
  },
  modeSelector: {
    marginBottom: 16,
  },
  optionsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  divider: {
    marginVertical: 8,
  },
  separatorButtons: {
    flex: 1,
    marginLeft: 16,
  },
  actions: {
    marginTop: 8,
  },
});
