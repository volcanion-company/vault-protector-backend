/**
 * @file Edit Vault Item Screen
 * @description Edit existing vault items
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Text, useTheme, TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MD3Theme } from 'react-native-paper';

import { Loading } from '@/components/ui';
import { PasswordGeneratorModal } from '@/components/PasswordGeneratorModal';
import { useVault } from '@/hooks/useVault';
import { useTranslation } from '@/i18n';
import type { PasswordEntry, SecureNote, CardEntry, IdentityEntry } from '@/types/vault.types';

export default function EditVaultItemScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem, update, isUpdating } = useVault();
  const { t } = useTranslation();

  const item = getItem(id || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (item) {
      setFormData(item.data as unknown as Record<string, string>);
    }
  }, [item]);

  const handleGeneratePassword = useCallback((password: string) => {
    setFormData((prev) => ({ ...prev, password }));
    setShowGenerator(false);
  }, []);

  const handleOpenUrl = useCallback(async (url: string) => {
    if (!url) return;
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = `https://${url}`;
    }
    try {
      await Linking.openURL(finalUrl);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await update({ id: id!, updates: { data: formData as unknown as PasswordEntry } });
      router.back();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  }, [update, id, formData, router]);

  if (!item) {
    return <Loading fullScreen message={t('common.loading')} />;
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderPasswordForm = () => (
    <>
      <TextInput
        label={t('passwordForm.name')}
        value={formData.name || ''}
        onChangeText={(text) => updateField('name', text)}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label={t('passwordForm.username')}
        value={formData.username || ''}
        onChangeText={(text) => updateField('username', text)}
        mode="outlined"
        autoCapitalize="none"
        style={styles.input}
      />
      <View style={styles.passwordRow}>
        <TextInput
          label={t('passwordForm.password')}
          value={formData.password || ''}
          onChangeText={(text) => updateField('password', text)}
          mode="outlined"
          secureTextEntry={!showPassword}
          style={[styles.input, styles.passwordInput]}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />
        <IconButton
          icon="dice-multiple"
          mode="contained"
          onPress={() => setShowGenerator(true)}
          style={styles.generateButton}
        />
      </View>
      <View style={styles.urlRow}>
        <TextInput
          label={t('passwordForm.url')}
          value={formData.url || ''}
          onChangeText={(text) => updateField('url', text)}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="url"
          style={[styles.input, styles.urlInput]}
        />
        {formData.url ? (
          <IconButton
            icon="open-in-new"
            mode="contained-tonal"
            onPress={() => handleOpenUrl(formData.url)}
            style={styles.openUrlButton}
          />
        ) : null}
      </View>
      <TextInput
        label={t('passwordForm.notes')}
        value={formData.notes || ''}
        onChangeText={(text) => updateField('notes', text)}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
    </>
  );

  const renderNoteForm = () => (
    <>
      <TextInput
        label={t('noteForm.title')}
        value={formData.title || ''}
        onChangeText={(text) => updateField('title', text)}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label={t('noteForm.content')}
        value={formData.content || ''}
        onChangeText={(text) => updateField('content', text)}
        mode="outlined"
        multiline
        numberOfLines={10}
        style={styles.input}
      />
    </>
  );

  const renderCardForm = () => (
    <>
      <TextInput
        label={t('cardForm.name')}
        value={formData.name || ''}
        onChangeText={(text) => updateField('name', text)}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label={t('cardForm.cardholderName')}
        value={formData.cardholderName || ''}
        onChangeText={(text) => updateField('cardholderName', text)}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label={t('cardForm.cardNumber')}
        value={formData.number || ''}
        onChangeText={(text) => updateField('number', text)}
        mode="outlined"
        keyboardType="number-pad"
        style={styles.input}
      />
      <View style={styles.row}>
        <TextInput
          label={t('cardForm.expiryMonth')}
          value={formData.expiryMonth || ''}
          onChangeText={(text) => updateField('expiryMonth', text)}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={2}
          style={[styles.input, styles.halfInput]}
        />
        <TextInput
          label={t('cardForm.expiryYear')}
          value={formData.expiryYear || ''}
          onChangeText={(text) => updateField('expiryYear', text)}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={4}
          style={[styles.input, styles.halfInput]}
        />
      </View>
      <TextInput
        label={t('cardForm.cvv')}
        value={formData.cvv || ''}
        onChangeText={(text) => updateField('cvv', text)}
        mode="outlined"
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        label={t('cardForm.notes')}
        value={formData.notes || ''}
        onChangeText={(text) => updateField('notes', text)}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
    </>
  );

  const renderIdentityForm = () => (
    <>
      <TextInput
        label={t('identityForm.name')}
        value={formData.name || ''}
        onChangeText={(text) => updateField('name', text)}
        mode="outlined"
        style={styles.input}
      />
      <View style={styles.row}>
        <TextInput
          label={t('identityForm.firstName')}
          value={formData.firstName || ''}
          onChangeText={(text) => updateField('firstName', text)}
          mode="outlined"
          style={[styles.input, styles.halfInput]}
        />
        <TextInput
          label={t('identityForm.lastName')}
          value={formData.lastName || ''}
          onChangeText={(text) => updateField('lastName', text)}
          mode="outlined"
          style={[styles.input, styles.halfInput]}
        />
      </View>
      <TextInput
        label={t('identityForm.email')}
        value={formData.email || ''}
        onChangeText={(text) => updateField('email', text)}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label={t('identityForm.phone')}
        value={formData.phone || ''}
        onChangeText={(text) => updateField('phone', text)}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        label={t('identityForm.address')}
        value={formData.address || ''}
        onChangeText={(text) => updateField('address', text)}
        mode="outlined"
        style={styles.input}
      />
      <View style={styles.row}>
        <TextInput
          label={t('identityForm.city')}
          value={formData.city || ''}
          onChangeText={(text) => updateField('city', text)}
          mode="outlined"
          style={[styles.input, styles.halfInput]}
        />
        <TextInput
          label={t('identityForm.country')}
          value={formData.country || ''}
          onChangeText={(text) => updateField('country', text)}
          mode="outlined"
          style={[styles.input, styles.halfInput]}
        />
      </View>
      <TextInput
        label={t('identityForm.notes')}
        value={formData.notes || ''}
        onChangeText={(text) => updateField('notes', text)}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {item.type === 'password' && renderPasswordForm()}
            {item.type === 'note' && renderNoteForm()}
            {item.type === 'card' && renderCardForm()}
            {item.type === 'identity' && renderIdentityForm()}
          </View>

          <View style={styles.actions}>
            <Button mode="outlined" onPress={() => router.back()} style={styles.button}>
              {t('common.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isUpdating}
              disabled={isUpdating}
              style={styles.button}
            >
              {t('common.save')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Password Generator Modal */}
      <PasswordGeneratorModal
        visible={showGenerator}
        onDismiss={() => setShowGenerator(false)}
        onUsePassword={handleGeneratePassword}
      />
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
    padding: 16,
  },
  form: {
    gap: 8,
  },
  input: {
    marginBottom: 8,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  generateButton: {
    marginLeft: 8,
    marginBottom: 8,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
  },
  openUrlButton: {
    marginLeft: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  button: {
    minWidth: 100,
  },
});
