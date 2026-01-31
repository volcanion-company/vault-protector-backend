/**
 * @file Add Vault Item Screen
 * @description Create new vault items (password, note, card, identity)
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Text, useTheme, Chip, TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MD3Theme } from 'react-native-paper';

import { useVault } from '@/hooks/useVault';
import { useTranslation } from '@/i18n';
import { PasswordGeneratorModal } from '@/components/PasswordGeneratorModal';
import type { VaultItemType, PasswordEntry, SecureNote, CardEntry, IdentityEntry } from '@/types/vault.types';

export default function AddVaultItemScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ type?: string }>();
  const { createPassword, createNote, createCard, createIdentity, isCreating } = useVault();

  const [itemType, setItemType] = useState<VaultItemType>((params.type as VaultItemType) || 'password');
  const [showPassword, setShowPassword] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  // Form state for password
  const [passwordForm, setPasswordForm] = useState({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });

  // Form state for note
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
  });

  // Form state for card
  const [cardForm, setCardForm] = useState({
    name: '',
    cardholderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    notes: '',
  });

  // Form state for identity
  const [identityForm, setIdentityForm] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleGeneratePassword = useCallback((generatedPassword: string) => {
    setPasswordForm((prev) => ({ ...prev, password: generatedPassword }));
  }, []);

  const handleOpenUrl = useCallback(async (url: string) => {
    if (!url) return;
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }
    try {
      await Linking.openURL(fullUrl);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      switch (itemType) {
        case 'password':
          await createPassword(
            {
              title: passwordForm.name,
              username: passwordForm.username,
              password: passwordForm.password,
              url: passwordForm.url,
              notes: passwordForm.notes,
              tags: [],
              favorite: isFavorite,
            } as PasswordEntry,
            { isFavorite }
          );
          break;
        case 'note':
          await createNote(
            {
              title: noteForm.title,
              content: noteForm.content,
              tags: [],
              favorite: isFavorite,
            } as SecureNote,
            { isFavorite }
          );
          break;
        case 'card':
          await createCard(
            {
              title: cardForm.name,
              cardholderName: cardForm.cardholderName,
              cardNumber: cardForm.number,
              expiryMonth: cardForm.expiryMonth,
              expiryYear: cardForm.expiryYear,
              cvv: cardForm.cvv,
              notes: cardForm.notes,
              tags: [],
              favorite: isFavorite,
            } as CardEntry,
            { isFavorite }
          );
          break;
        case 'identity':
          await createIdentity(
            {
              title: identityForm.name,
              firstName: identityForm.firstName,
              lastName: identityForm.lastName,
              email: identityForm.email,
              phone: identityForm.phone,
              address: identityForm.address,
              notes: identityForm.notes,
              tags: [],
              favorite: isFavorite,
            } as IdentityEntry,
            { isFavorite }
          );
          break;
      }
      router.back();
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  }, [
    itemType,
    passwordForm,
    noteForm,
    cardForm,
    identityForm,
    isFavorite,
    createPassword,
    createNote,
    createCard,
    createIdentity,
    router,
  ]);

  const renderPasswordForm = () => (
    <>
      <TextInput
        label={t('passwordForm.name')}
        value={passwordForm.name}
        onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, name: text }))}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label={t('passwordForm.username')}
        value={passwordForm.username}
        onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, username: text }))}
        mode="outlined"
        autoCapitalize="none"
        style={styles.input}
      />
      <View style={styles.passwordRow}>
        <TextInput
          label={t('passwordForm.password')}
          value={passwordForm.password}
          onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, password: text }))}
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
          label={t('passwordForm.websiteUrl')}
          value={passwordForm.url}
          onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, url: text }))}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="url"
          style={[styles.input, styles.urlInput]}
        />
        {passwordForm.url ? (
          <IconButton
            icon="open-in-new"
            mode="contained-tonal"
            onPress={() => handleOpenUrl(passwordForm.url)}
            style={styles.openUrlButton}
          />
        ) : null}
      </View>
      <TextInput
        label={t('passwordForm.notes')}
        value={passwordForm.notes}
        onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, notes: text }))}
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
        value={noteForm.title}
        onChangeText={(text) => setNoteForm((prev) => ({ ...prev, title: text }))}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label={t('noteForm.content')}
        value={noteForm.content}
        onChangeText={(text) => setNoteForm((prev) => ({ ...prev, content: text }))}
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
        label={t('cardForm.namePlaceholder')}
        value={cardForm.name}
        onChangeText={(text) => setCardForm((prev) => ({ ...prev, name: text }))}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label={t('cardForm.cardholderName')}
        value={cardForm.cardholderName}
        onChangeText={(text) => setCardForm((prev) => ({ ...prev, cardholderName: text }))}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label={t('cardForm.cardNumber')}
        value={cardForm.number}
        onChangeText={(text) => setCardForm((prev) => ({ ...prev, number: text }))}
        mode="outlined"
        keyboardType="number-pad"
        style={styles.input}
      />
      <View style={styles.row}>
        <TextInput
          label={t('cardForm.expiryMonth')}
          value={cardForm.expiryMonth}
          onChangeText={(text) => setCardForm((prev) => ({ ...prev, expiryMonth: text }))}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={2}
          style={[styles.input, styles.halfInput]}
        />
        <TextInput
          label={t('cardForm.expiryYear')}
          value={cardForm.expiryYear}
          onChangeText={(text) => setCardForm((prev) => ({ ...prev, expiryYear: text }))}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={4}
          style={[styles.input, styles.halfInput]}
        />
      </View>
      <TextInput
        label={t('cardForm.cvv')}
        value={cardForm.cvv}
        onChangeText={(text) => setCardForm((prev) => ({ ...prev, cvv: text }))}
        mode="outlined"
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        label={t('cardForm.notes')}
        value={cardForm.notes}
        onChangeText={(text) => setCardForm((prev) => ({ ...prev, notes: text }))}
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
        label={t('identityForm.namePlaceholder')}
        value={identityForm.name}
        onChangeText={(text) => setIdentityForm((prev) => ({ ...prev, name: text }))}
        mode="outlined"
        style={styles.input}
      />
      <View style={styles.row}>
        <TextInput
          label={t('identityForm.firstName')}
          value={identityForm.firstName}
          onChangeText={(text) => setIdentityForm((prev) => ({ ...prev, firstName: text }))}
          mode="outlined"
          style={[styles.input, styles.halfInput]}
        />
        <TextInput
          label={t('identityForm.lastName')}
          value={identityForm.lastName}
          onChangeText={(text) => setIdentityForm((prev) => ({ ...prev, lastName: text }))}
          mode="outlined"
          style={[styles.input, styles.halfInput]}
        />
      </View>
      <TextInput
        label={t('identityForm.email')}
        value={identityForm.email}
        onChangeText={(text) => setIdentityForm((prev) => ({ ...prev, email: text }))}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label={t('identityForm.phone')}
        value={identityForm.phone}
        onChangeText={(text) => setIdentityForm((prev) => ({ ...prev, phone: text }))}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        label={t('identityForm.address')}
        value={identityForm.address}
        onChangeText={(text) => setIdentityForm((prev) => ({ ...prev, address: text }))}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label={t('identityForm.notes')}
        value={identityForm.notes}
        onChangeText={(text) => setIdentityForm((prev) => ({ ...prev, notes: text }))}
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
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.typeSelector}
            contentContainerStyle={styles.typeSelectorContent}
          >
            <Chip
              icon="key"
              selected={itemType === 'password'}
              onPress={() => setItemType('password')}
              mode={itemType === 'password' ? 'flat' : 'outlined'}
              style={styles.typeChip}
            >
              {t('vault.itemTypes.password')}
            </Chip>
            <Chip
              icon="note-text"
              selected={itemType === 'note'}
              onPress={() => setItemType('note')}
              mode={itemType === 'note' ? 'flat' : 'outlined'}
              style={styles.typeChip}
            >
              {t('vault.itemTypes.note')}
            </Chip>
            <Chip
              icon="credit-card"
              selected={itemType === 'card'}
              onPress={() => setItemType('card')}
              mode={itemType === 'card' ? 'flat' : 'outlined'}
              style={styles.typeChip}
            >
              {t('vault.itemTypes.card')}
            </Chip>
            <Chip
              icon="account"
              selected={itemType === 'identity'}
              onPress={() => setItemType('identity')}
              mode={itemType === 'identity' ? 'flat' : 'outlined'}
              style={styles.typeChip}
            >
              {t('vault.itemTypes.identity')}
            </Chip>
          </ScrollView>

          <View style={styles.form}>
            {itemType === 'password' && renderPasswordForm()}
            {itemType === 'note' && renderNoteForm()}
            {itemType === 'card' && renderCardForm()}
            {itemType === 'identity' && renderIdentityForm()}
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.button}
            >
              {t('common.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isCreating}
              disabled={isCreating}
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
  typeSelector: {
    marginBottom: 20,
  },
  typeSelectorContent: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    // Each chip auto-sizes to content
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
