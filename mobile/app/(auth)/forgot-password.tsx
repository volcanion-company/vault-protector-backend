/**
 * @file Forgot Password Screen
 * @description Request password reset email
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { MD3Theme } from 'react-native-paper';

import { Button, TextInput } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { t } = useTranslation();
  const { forgotPassword, isSendingReset, forgotPasswordError } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = useCallback(
    async (data: ForgotPasswordFormData) => {
      setShowError(false);
      try {
        await forgotPassword(data.email);
        setIsSuccess(true);
      } catch (error) {
        setShowError(true);
        console.error('Reset request failed:', error);
      }
    },
    [forgotPassword]
  );

  if (isSuccess) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.successContainer}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={styles.successIcon}>✉️</Text>
          </View>
          <Text variant="headlineSmall" style={styles.successTitle}>
            {t('auth.checkEmail')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.successText, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('auth.checkEmailDescription')}
          </Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
            {t('auth.backToLogin')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('auth.forgotPasswordDescription')}
            </Text>
          </View>

          {/* Note */}
          <View style={[styles.note, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
              ℹ️ {t('auth.forgotPasswordNote')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t('auth.email')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  left="email"
                  testID="forgot-email"
                />
              )}
            />

            {showError && forgotPasswordError && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {forgotPasswordError instanceof Error
                  ? forgotPasswordError.message
                  : t('errors.unknownError')}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isSendingReset}
              disabled={isSendingReset}
              fullWidth
              style={styles.submitButton}
              testID="forgot-button"
            >
              {t('auth.sendResetLink')}
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
    marginBottom: 16,
  },
  note: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  form: {
    flex: 1,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 36,
  },
  successTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  backButton: {
    minWidth: 200,
  },
});
