/**
 * @file Login Screen
 * @description User login with email and password
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { MD3Theme } from 'react-native-paper';

import { Button, TextInput } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const theme = useTheme<MD3Theme>();
  const { login, isLoggingIn, loginError } = useAuth();
  const { t } = useTranslation();
  const [showError, setShowError] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      setShowError(false);
      try {
        await login({
          email: data.email,
          password: data.password,
        });
      } catch (error) {
        setShowError(true);
        console.error('Login failed:', error);
      }
    },
    [login]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            <Text variant="headlineLarge" style={styles.title}>
              Vault Protector
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('auth.signInToAccess')}
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
                  testID="login-email"
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
                  secureTextEntry
                  autoComplete="password"
                  left="lock"
                  testID="login-password"
                />
              )}
            />

            {showError && loginError && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {loginError instanceof Error ? loginError.message : t('auth.loginFailed')}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoggingIn}
              disabled={isLoggingIn}
              fullWidth
              style={styles.loginButton}
              testID="login-button"
            >
              {t('common.signIn')}
            </Button>

            <Link href="/(auth)/forgot-password" asChild>
              <Button mode="text" style={styles.forgotButton}>
                {t('auth.forgotPassword')}
              </Button>
            </Link>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('auth.dontHaveAccount')}{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <Button mode="text" compact>
                {t('auth.createAccount')}
              </Button>
            </Link>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  form: {
    marginBottom: 24,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 16,
  },
  forgotButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
});
