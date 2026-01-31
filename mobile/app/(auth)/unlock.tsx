/**
 * @file Unlock Screen
 * @description Unlock vault with password or biometrics
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { MD3Theme } from 'react-native-paper';

import { Button, TextInput, Loading } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useBiometric } from '@/hooks/useBiometric';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/i18n';

// Validation schema
const unlockSchema = z.object({
  password: z.string().min(1, 'Please enter your master password'),
});

type UnlockFormData = z.infer<typeof unlockSchema>;

export default function UnlockScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { unlockWithPassword, logout, isLoggingOut } = useAuth();
  const { unlockVault, isEnabled: biometricEnabled, status: biometricStatus, biometricName } = useBiometric();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UnlockFormData>({
    resolver: zodResolver(unlockSchema),
    defaultValues: {
      password: '',
    },
  });

  // Try biometric unlock on mount if enabled
  useEffect(() => {
    if (biometricEnabled) {
      handleBiometricUnlock();
    }
  }, []);

  const handleBiometricUnlock = useCallback(async () => {
    if (!biometricEnabled) return;

    setError(null);
    setIsUnlocking(true);

    try {
      const success = await unlockVault();
      if (success) {
        // Navigate to vault after successful unlock
        router.replace('/(tabs)/vault');
      }
      // If not success, user cancelled or failed - show password form
    } catch (err) {
      console.error('Biometric unlock failed:', err);
    } finally {
      setIsUnlocking(false);
    }
  }, [biometricEnabled, unlockVault, router]);

  const onSubmit = useCallback(
    async (data: UnlockFormData) => {
      setError(null);
      setIsUnlocking(true);

      try {
        const success = await unlockWithPassword(data.password);
        if (success) {
          // Navigate to vault after successful unlock
          router.replace('/(tabs)/vault');
        } else {
          setError(t('auth.invalidMasterPassword'));
        }
      } catch (err) {
        setError(t('auth.unlockFailed'));
        console.error('Unlock failed:', err);
      } finally {
        setIsUnlocking(false);
      }
    },
    [unlockWithPassword, router]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  if (isLoggingOut) {
    return <Loading fullScreen message={t('auth.loggingOut')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
          <Text variant="headlineSmall" style={styles.title}>
            {t('auth.vaultLocked')}
          </Text>
          {user?.email && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {user.email}
            </Text>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t('auth.masterPassword')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message || error || undefined}
                secureTextEntry
                autoComplete="password"
                left="lock"
                onSubmitEditing={handleSubmit(onSubmit)}
                returnKeyType="done"
                testID="unlock-password"
              />
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isUnlocking}
            disabled={isUnlocking}
            fullWidth
            style={styles.unlockButton}
            testID="unlock-button"
          >
            {t('auth.unlock')}
          </Button>

          {/* Biometric button */}
          {biometricEnabled && biometricStatus?.canAuthenticate && (
            <Button
              mode="outlined"
              onPress={handleBiometricUnlock}
              disabled={isUnlocking}
              fullWidth
              icon={biometricStatus.biometryType === 'facial' ? 'face-recognition' : 'fingerprint'}
              style={styles.biometricButton}
            >
              {t('settings.unlockWithBiometric', { biometric: biometricName })}
            </Button>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            mode="text"
            onPress={handleLogout}
            disabled={isUnlocking}
            textColor={theme.colors.error}
          >
            {t('auth.logout')}
          </Button>
        </View>
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
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockIcon: {
    fontSize: 36,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  form: {
    marginBottom: 24,
  },
  unlockButton: {
    marginTop: 16,
  },
  biometricButton: {
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
});
