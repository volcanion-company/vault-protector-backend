/**
 * @file Settings Screen
 * @description App settings and preferences
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Switch, Divider, useTheme, Text, Portal, Dialog, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { MD3Theme } from 'react-native-paper';

import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useBiometric } from '@/hooks/useBiometric';
import { useTranslation } from '@/i18n';
import { APP_VERSION, BUILD_NUMBER } from '@/config/env';

export default function SettingsScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { t } = useTranslation();
  const { logout, isLoggingOut, lockVault } = useAuth();
  const { user } = useAuthStore();
  const {
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    clipboardTimeout,
    setClipboardTimeout,
    autoLockTimeout,
    setAutoLockTimeout,
    autoSync,
    setAutoSync,
  } = useSettingsStore();
  const {
    isEnabled: biometricEnabled,
    canEnable: canEnableBiometric,
    biometricName,
    toggle: toggleBiometric,
    error: biometricError,
  } = useBiometric();

  // Dialog states
  const [autoLockDialogVisible, setAutoLockDialogVisible] = useState(false);
  const [clipboardDialogVisible, setClipboardDialogVisible] = useState(false);

  // Handle logout
  const handleLogout = useCallback(() => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  }, [logout, t]);

  // Handle biometric toggle
  const handleBiometricToggle = useCallback(async () => {
    const success = await toggleBiometric();
    if (!success && biometricError) {
      Alert.alert(t('common.error'), biometricError);
    }
  }, [toggleBiometric, biometricError, t]);

  // Handle theme change (toggle between light and dark)
  const handleThemeChange = useCallback(() => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  }, [themeMode, setThemeMode]);

  // Handle language change
  const handleLanguageChange = useCallback(() => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  }, [language, setLanguage]);

  const getThemeLabel = () => {
    return themeMode === 'light' ? t('settings.themeLight') : t('settings.themeDark');
  };

  const getLanguageLabel = () => {
    return language === 'en' ? t('settings.languageEnglish') : t('settings.languageVietnamese');
  };

  const getAutoLockLabel = (minutes: number) => {
    return t('settings.autoLockMinutes', { minutes });
  };

  const getClipboardLabel = (seconds: number) => {
    return t('settings.clipboardSeconds', { seconds });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView>
        {/* Account Section */}
        <List.Section>
          <List.Subheader>{t('settings.account')}</List.Subheader>
          <List.Item
            title={t('settings.email')}
            description={user?.email || 'Not logged in'}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          <List.Item
            title={t('settings.changeMasterPassword')}
            left={(props) => <List.Icon {...props} icon="lock-reset" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/settings/change-password' as any)}
          />
          <List.Item
            title={t('settings.lockVault')}
            description={t('settings.lockVaultDescription')}
            left={(props) => <List.Icon {...props} icon="lock" />}
            onPress={lockVault}
          />
        </List.Section>

        <Divider />

        {/* Security Section */}
        <List.Section>
          <List.Subheader>{t('settings.security')}</List.Subheader>
          {canEnableBiometric && (
            <List.Item
              title={t('settings.unlockWithBiometric', { biometric: biometricName })}
              description={t('settings.biometricDescription')}
              left={(props) => <List.Icon {...props} icon="fingerprint" />}
              right={() => (
                <Switch value={biometricEnabled} onValueChange={handleBiometricToggle} />
              )}
            />
          )}
          <List.Item
            title={t('settings.autoLock')}
            description={getAutoLockLabel(autoLockTimeout)}
            left={(props) => <List.Icon {...props} icon="timer-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setAutoLockDialogVisible(true)}
          />
          <List.Item
            title={t('settings.clipboardTimeout')}
            description={getClipboardLabel(clipboardTimeout)}
            left={(props) => <List.Icon {...props} icon="clipboard-clock-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setClipboardDialogVisible(true)}
          />
        </List.Section>

        <Divider />

        {/* Appearance Section */}
        <List.Section>
          <List.Subheader>{t('settings.appearance')}</List.Subheader>
          <List.Item
            title={t('settings.theme')}
            description={getThemeLabel()}
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleThemeChange}
          />
          <List.Item
            title={t('settings.language')}
            description={getLanguageLabel()}
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleLanguageChange}
          />
        </List.Section>

        <Divider />

        {/* Sync Section */}
        <List.Section>
          <List.Subheader>{t('settings.sync')}</List.Subheader>
          <List.Item
            title={t('settings.autoSync')}
            description={t('settings.autoSyncDescription')}
            left={(props) => <List.Icon {...props} icon="cloud-sync" />}
            right={() => (
              <Switch value={autoSync} onValueChange={setAutoSync} />
            )}
          />
          <List.Item
            title={t('settings.syncNow')}
            left={(props) => <List.Icon {...props} icon="refresh" />}
            onPress={() => {
              Alert.alert(t('settings.sync'), t('settings.syncSuccess'));
            }}
          />
        </List.Section>

        <Divider />

        {/* Devices Section */}
        <List.Section>
          <List.Subheader>{t('settings.devices')}</List.Subheader>
          <List.Item
            title={t('settings.manageDevices')}
            description={t('settings.manageDevicesDescription')}
            left={(props) => <List.Icon {...props} icon="devices" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/settings/devices' as any)}
          />
          <List.Item
            title={t('settings.activeSessions')}
            description={t('settings.activeSessionsDescription')}
            left={(props) => <List.Icon {...props} icon="login" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/settings/sessions' as any)}
          />
        </List.Section>

        <Divider />

        {/* About Section */}
        <List.Section>
          <List.Subheader>{t('settings.about')}</List.Subheader>
          <List.Item
            title={t('settings.version')}
            description={`${APP_VERSION} (${BUILD_NUMBER})`}
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title={t('settings.privacyPolicy')}
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/settings/privacy-policy' as any)}
          />
          <List.Item
            title={t('settings.termsOfService')}
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/settings/terms-of-service' as any)}
          />
        </List.Section>

        <Divider />

        {/* Logout */}
        <List.Section>
          <List.Item
            title={t('auth.logout')}
            titleStyle={{ color: theme.colors.error }}
            left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
            onPress={handleLogout}
            disabled={isLoggingOut}
          />
        </List.Section>
      </ScrollView>

      {/* Auto-lock Timeout Dialog */}
      <Portal>
        <Dialog visible={autoLockDialogVisible} onDismiss={() => setAutoLockDialogVisible(false)}>
          <Dialog.Title>{t('settings.autoLock')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={autoLockTimeout.toString()}
              onValueChange={(value) => {
                setAutoLockTimeout(parseInt(value, 10) as 1 | 5 | 15 | 30);
                setAutoLockDialogVisible(false);
              }}
            >
              <RadioButton.Item label={t('settings.autoLockMinutes', { minutes: 1 })} value="1" />
              <RadioButton.Item label={t('settings.autoLockMinutes', { minutes: 5 })} value="5" />
              <RadioButton.Item label={t('settings.autoLockMinutes', { minutes: 15 })} value="15" />
              <RadioButton.Item label={t('settings.autoLockMinutes', { minutes: 30 })} value="30" />
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Clipboard Timeout Dialog */}
      <Portal>
        <Dialog visible={clipboardDialogVisible} onDismiss={() => setClipboardDialogVisible(false)}>
          <Dialog.Title>{t('settings.clipboardTimeout')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={clipboardTimeout.toString()}
              onValueChange={(value) => {
                setClipboardTimeout(parseInt(value, 10) as 30 | 60 | 120);
                setClipboardDialogVisible(false);
              }}
            >
              <RadioButton.Item label={t('settings.clipboardSeconds', { seconds: 30 })} value="30" />
              <RadioButton.Item label={t('settings.clipboardSeconds', { seconds: 60 })} value="60" />
              <RadioButton.Item label={t('settings.clipboardSeconds', { seconds: 120 })} value="120" />
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
