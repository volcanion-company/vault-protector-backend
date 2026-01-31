/**
 * @file Password Generator Modal
 * @description Modal dialog for generating strong passwords
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  useTheme,
  Switch,
  IconButton,
  Surface,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import type { MD3Theme } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';

import { generatePassword } from '@/services/crypto';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTranslation } from '@/i18n';

interface PasswordGeneratorModalProps {
  visible: boolean;
  onDismiss: () => void;
  onUsePassword: (password: string) => void;
}

export function PasswordGeneratorModal({
  visible,
  onDismiss,
  onUsePassword,
}: PasswordGeneratorModalProps) {
  const theme = useTheme<MD3Theme>();
  const { t } = useTranslation();
  const { generatorDefaults } = useSettingsStore();

  const [password, setPassword] = useState('');
  const [length, setLength] = useState(generatorDefaults.length);
  const [uppercase, setUppercase] = useState(generatorDefaults.uppercase);
  const [lowercase, setLowercase] = useState(generatorDefaults.lowercase);
  const [numbers, setNumbers] = useState(generatorDefaults.numbers);
  const [symbols, setSymbols] = useState(generatorDefaults.symbols);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    const newPassword = generatePassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      excludeAmbiguous,
    });
    setPassword(newPassword);
    setCopied(false);
  }, [length, uppercase, lowercase, numbers, symbols, excludeAmbiguous]);

  // Generate password on mount and when options change
  useEffect(() => {
    if (visible) {
      handleGenerate();
    }
  }, [visible, handleGenerate]);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [password]);

  const handleUse = useCallback(() => {
    onUsePassword(password);
    onDismiss();
  }, [password, onUsePassword, onDismiss]);

  const getPasswordStrength = (): { label: string; color: string } => {
    let score = 0;
    if (length >= 12) score++;
    if (length >= 16) score++;
    if (length >= 20) score++;
    if (uppercase) score++;
    if (lowercase) score++;
    if (numbers) score++;
    if (symbols) score++;

    if (score <= 3) return { label: 'Weak', color: theme.colors.error };
    if (score <= 5) return { label: 'Medium', color: theme.colors.tertiary };
    return { label: 'Strong', color: '#4CAF50' };
  };

  const strength = getPasswordStrength();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text variant="titleLarge" style={styles.title}>
          {t('generator.title')}
        </Text>

        {/* Generated Password Display */}
        <Surface style={[styles.passwordContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text
            variant="bodyLarge"
            style={[styles.passwordText, { color: theme.colors.onSurfaceVariant }]}
            selectable
            numberOfLines={2}
          >
            {password}
          </Text>
          <View style={styles.passwordActions}>
            <IconButton
              icon={copied ? 'check' : 'content-copy'}
              size={20}
              onPress={handleCopy}
            />
            <IconButton icon="refresh" size={20} onPress={handleGenerate} />
          </View>
        </Surface>

        {/* Strength Indicator */}
        <View style={styles.strengthContainer}>
          <View style={[styles.strengthBar, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View
              style={[
                styles.strengthFill,
                {
                  backgroundColor: strength.color,
                  width: `${(password.length / 32) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>
            {strength.label}
          </Text>
        </View>

        {/* Length Slider */}
        <View style={styles.option}>
          <Text variant="bodyMedium">{t('generator.length')}: {length}</Text>
          <Slider
            style={styles.slider}
            minimumValue={8}
            maximumValue={64}
            step={1}
            value={length}
            onValueChange={setLength}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.surfaceVariant}
            thumbTintColor={theme.colors.primary}
          />
        </View>

        {/* Options */}
        <View style={styles.optionsGrid}>
          <View style={styles.optionRow}>
            <Text variant="bodyMedium">{t('generator.uppercase')}</Text>
            <Switch value={uppercase} onValueChange={setUppercase} />
          </View>
          <View style={styles.optionRow}>
            <Text variant="bodyMedium">{t('generator.lowercase')}</Text>
            <Switch value={lowercase} onValueChange={setLowercase} />
          </View>
          <View style={styles.optionRow}>
            <Text variant="bodyMedium">{t('generator.numbers')}</Text>
            <Switch value={numbers} onValueChange={setNumbers} />
          </View>
          <View style={styles.optionRow}>
            <Text variant="bodyMedium">{t('generator.symbols')}</Text>
            <Switch value={symbols} onValueChange={setSymbols} />
          </View>
          <View style={styles.optionRow}>
            <Text variant="bodyMedium">{t('generator.excludeAmbiguous')}</Text>
            <Switch value={excludeAmbiguous} onValueChange={setExcludeAmbiguous} />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button mode="outlined" onPress={onDismiss} style={styles.actionButton}>
            {t('common.cancel')}
          </Button>
          <Button mode="contained" onPress={handleUse} style={styles.actionButton}>
            {t('generator.use')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  passwordText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 16,
  },
  passwordActions: {
    flexDirection: 'row',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
  },
  strengthLabel: {
    fontWeight: '600',
    fontSize: 12,
  },
  option: {
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  optionsGrid: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    minWidth: 100,
  },
});
