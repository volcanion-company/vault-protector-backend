/**
 * @file Register Screen
 * @description New account registration with login password
 * Master Password will be set separately after registration
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

// Validation schema - login password, not Master Password
const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const theme = useTheme<MD3Theme>();
  const { register, isRegistering, registerError } = useAuth();
  const { t } = useTranslation();
  const [showError, setShowError] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      setShowError(false);
      try {
        await register({
          email: data.email,
          password: data.password,
        });
      } catch (error) {
        setShowError(true);
        console.error('Registration failed:', error);
      }
    },
    [register]
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
            <Text variant="headlineSmall" style={styles.title}>
              {t('auth.createYourAccount')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('auth.registerDescription')}
            </Text>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
              {t('auth.registerInfo')}
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
                  testID="register-email"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t('auth.password')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  helperText={t('auth.loginPasswordRequirements')}
                  secureTextEntry
                  autoComplete="new-password"
                  left="lock"
                  testID="register-password"
                />
              )}
            />

            <PasswordStrengthIndicator password={password} showFeedback />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t('auth.confirmPassword')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  autoComplete="new-password"
                  left="lock-check"
                  testID="register-confirm"
                />
              )}
            />

            {showError && registerError && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {registerError instanceof Error ? registerError.message : t('auth.registrationFailed')}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isRegistering}
              disabled={isRegistering}
              fullWidth
              style={styles.submitButton}
              testID="register-button"
            >
              {t('auth.createAccount')}
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
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  submitButton: {
    marginTop: 24,
  },
});
