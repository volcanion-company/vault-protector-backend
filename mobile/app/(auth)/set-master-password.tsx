/**
 * @file Set Master Password Screen
 * @description Screen for setting up Master Password after registration or login
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { MD3Theme } from 'react-native-paper';

import { Button, TextInput, PasswordStrengthIndicator } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';

// Validation schema
const setMasterPasswordSchema = z
  .object({
    masterPassword: z
      .string()
      .min(12, 'Master password must be at least 12 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.masterPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SetMasterPasswordFormData = z.infer<typeof setMasterPasswordSchema>;

export default function SetMasterPasswordScreen() {
  const theme = useTheme<MD3Theme>();
  const { setMasterPassword, isSettingMasterPassword, setMasterPasswordError } = useAuth();
  const { t } = useTranslation();
  const [showError, setShowError] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetMasterPasswordFormData>({
    resolver: zodResolver(setMasterPasswordSchema),
    defaultValues: {
      masterPassword: '',
      confirmPassword: '',
    },
  });

  const masterPassword = watch('masterPassword');

  const onSubmit = useCallback(
    async (data: SetMasterPasswordFormData) => {
      setShowError(false);
      try {
        await setMasterPassword(data.masterPassword);
      } catch (error) {
        setShowError(true);
        console.error('Failed to set Master Password:', error);
      }
    },
    [setMasterPassword]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              {t('auth.setMasterPasswordTitle')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('auth.setMasterPasswordDescription')}
            </Text>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
              {t('auth.masterPasswordInfo')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="masterPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t('auth.masterPassword')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.masterPassword?.message}
                  helperText={t('auth.passwordRequirements')}
                  secureTextEntry
                  autoComplete="new-password"
                  left="lock"
                  testID="master-password"
                />
              )}
            />

            <PasswordStrengthIndicator password={masterPassword} showFeedback />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t('auth.confirmMasterPassword')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  autoComplete="new-password"
                  left="lock-check"
                  testID="confirm-password"
                />
              )}
            />

            {/* Warning */}
            <View style={[styles.warning, { backgroundColor: theme.colors.errorContainer }]}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onErrorContainer }}
              >
                {t('auth.importantWarning')}
              </Text>
            </View>

            {showError && setMasterPasswordError && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {setMasterPasswordError instanceof Error
                  ? setMasterPasswordError.message
                  : t('auth.setMasterPasswordFailed')}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isSettingMasterPassword}
              disabled={isSettingMasterPassword}
              fullWidth
              style={styles.submitButton}
              testID="set-master-password-button"
            >
              {t('auth.setMasterPassword')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  form: {
    flex: 1,
  },
  warning: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
  },
});
