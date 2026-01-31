/**
 * @file Vault Item Detail Screen
 * @description View and manage a single vault item
 */

import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, useTheme, Card, Button, IconButton, Divider, Menu, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MD3Theme } from 'react-native-paper';

import { Loading } from '@/components/ui';
import { useVault } from '@/hooks/useVault';
import { useClipboard } from '@/hooks/useClipboard';
import { useTranslation } from '@/i18n';
import type { PasswordEntry, SecureNote, CardEntry, IdentityEntry } from '@/types/vault.types';

export default function VaultItemDetailScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem, delete: deleteItem, toggleFavorite, restore, permanentDelete, isDeleting } = useVault();
  const { copy, copyPassword } = useClipboard();
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const item = useMemo(() => getItem(id || ''), [id, getItem]);

  const handleEdit = useCallback(() => {
    router.push({
      pathname: '/vault/edit/[id]' as any,
      params: { id },
    });
  }, [router, id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      t('common.delete'),
      t('vault.confirmMoveToTrash') || 'Are you sure you want to move this item to trash?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(id!);
              router.back();
            } catch (error) {
              console.error('Failed to delete:', error);
            }
          },
        },
      ]
    );
  }, [deleteItem, id, router, t]);

  const handlePermanentDelete = useCallback(() => {
    Alert.alert(
      t('vault.permanentDelete') || 'Permanently Delete',
      t('vault.permanentDeleteConfirm') || 'This action cannot be undone. Are you sure?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('vault.deleteForever') || 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await permanentDelete(id!);
              router.back();
            } catch (error) {
              console.error('Failed to permanently delete:', error);
            }
          },
        },
      ]
    );
  }, [permanentDelete, id, router, t]);

  const handleRestore = useCallback(async () => {
    try {
      await restore(id!);
    } catch (error) {
      console.error('Failed to restore:', error);
    }
  }, [restore, id]);

  const handleToggleFavorite = useCallback(async () => {
    try {
      await toggleFavorite(id!);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [toggleFavorite, id]);

  if (!item) {
    return <Loading fullScreen message={t('common.loading')} />;
  }

  const renderPasswordDetails = () => {
    const data = item.data as PasswordEntry;
    return (
      <>
        <Card style={styles.card}>
          <Card.Content>
            {data.username && (
              <View style={styles.field}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('passwordForm.username')}
                </Text>
                <View style={styles.fieldRow}>
                  <Text variant="bodyLarge" style={styles.fieldValue}>
                    {data.username}
                  </Text>
                  <IconButton
                    icon="content-copy"
                    size={20}
                    onPress={() => copy(data.username!, { label: t('passwordForm.username') })}
                  />
                </View>
              </View>
            )}

            <Divider style={styles.divider} />

            {data.password && (
              <View style={styles.field}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('passwordForm.password')}
                </Text>
                <View style={styles.fieldRow}>
                  <Text variant="bodyLarge" style={styles.fieldValue}>
                    {showPassword ? data.password : '••••••••••••'}
                  </Text>
                  <IconButton
                    icon={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                  <IconButton
                    icon="content-copy"
                    size={20}
                    onPress={() => copyPassword(data.password!)}
                  />
                </View>
              </View>
            )}

            {data.url && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.field}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t('passwordForm.website')}
                  </Text>
                  <View style={styles.fieldRow}>
                    <Text variant="bodyLarge" style={[styles.fieldValue, { color: theme.colors.primary }]}>
                      {data.url}
                    </Text>
                    <IconButton
                      icon="content-copy"
                      size={20}
                      onPress={() => copy(data.url!, { label: t('passwordForm.website') })}
                    />
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {data.notes && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('passwordForm.notes')}
              </Text>
              <Text variant="bodyMedium" style={{ marginTop: 4 }}>
                {data.notes}
              </Text>
            </Card.Content>
          </Card>
        )}
      </>
    );
  };

  const renderNoteDetails = () => {
    const data = item.data as SecureNote;
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyLarge">{data.content}</Text>
        </Card.Content>
      </Card>
    );
  };

  const renderCardDetails = () => {
    const data = item.data as CardEntry;
    return (
      <Card style={styles.card}>
        <Card.Content>
          {data.cardholderName && (
            <View style={styles.field}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('cardForm.cardholderName')}
              </Text>
              <Text variant="bodyLarge">{data.cardholderName}</Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.field}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('cardForm.cardNumber')}
            </Text>
            <View style={styles.fieldRow}>
              <Text variant="bodyLarge" style={styles.fieldValue}>
                {showCardNumber ? data.cardNumber : '•••• •••• •••• ' + data.cardNumber?.slice(-4)}
              </Text>
              <IconButton
                icon={showCardNumber ? 'eye-off' : 'eye'}
                size={20}
                onPress={() => setShowCardNumber(!showCardNumber)}
              />
              <IconButton
                icon="content-copy"
                size={20}
                onPress={() => copy(data.cardNumber!, { label: t('cardForm.cardNumber') })}
              />
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('cardForm.expiry')}
              </Text>
              <Text variant="bodyLarge">
                {data.expiryMonth}/{data.expiryYear}
              </Text>
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('cardForm.cvv')}
              </Text>
              <View style={styles.fieldRow}>
                <Text variant="bodyLarge" style={styles.fieldValue}>
                  {showCVV ? data.cvv : '•••'}
                </Text>
                <IconButton
                  icon={showCVV ? 'eye-off' : 'eye'}
                  size={20}
                  onPress={() => setShowCVV(!showCVV)}
                />
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderIdentityDetails = () => {
    const data = item.data as IdentityEntry;
    return (
      <Card style={styles.card}>
        <Card.Content>
          {(data.firstName || data.lastName) && (
            <View style={styles.field}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('identityForm.fullName')}
              </Text>
              <Text variant="bodyLarge">
                {data.firstName} {data.lastName}
              </Text>
            </View>
          )}

          {data.email && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.field}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('identityForm.email')}
                </Text>
                <View style={styles.fieldRow}>
                  <Text variant="bodyLarge" style={styles.fieldValue}>
                    {data.email}
                  </Text>
                  <IconButton
                    icon="content-copy"
                    size={20}
                    onPress={() => copy(data.email!, { label: t('identityForm.email') })}
                  />
                </View>
              </View>
            </>
          )}

          {data.phone && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.field}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('identityForm.phone')}
                </Text>
                <View style={styles.fieldRow}>
                  <Text variant="bodyLarge" style={styles.fieldValue}>
                    {data.phone}
                  </Text>
                  <IconButton
                    icon="content-copy"
                    size={20}
                    onPress={() => copy(data.phone!, { label: t('identityForm.phone') })}
                  />
                </View>
              </View>
            </>
          )}

          {data.address && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.field}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('identityForm.address')}
                </Text>
                <Text variant="bodyLarge">
                  {data.address}
                </Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  const getItemName = () => {
    const data = item.data as any;
    return data.name || data.title || t('vault.untitled');
  };

  const getItemIcon = () => {
    switch (item.type) {
      case 'password':
        return 'key';
      case 'note':
        return 'note-text';
      case 'card':
        return 'credit-card';
      case 'identity':
        return 'account';
      default:
        return 'file';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconButton
              icon={getItemIcon()}
              size={32}
              mode="contained"
              containerColor={theme.colors.primaryContainer}
              iconColor={theme.colors.onPrimaryContainer}
            />
            <View style={styles.headerText}>
              <Text variant="headlineSmall">{getItemName()}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t(`vault.itemTypes.${item.type}`)}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {item.isFavorite && <Chip icon="star" compact>{t('vault.favorite')}</Chip>}
            {item.isDeleted && <Chip icon="delete" compact>{t('vault.trash')}</Chip>}
          </View>
        </View>

        {/* Content */}
        {item.type === 'password' && renderPasswordDetails()}
        {item.type === 'note' && renderNoteDetails()}
        {item.type === 'card' && renderCardDetails()}
        {item.type === 'identity' && renderIdentityDetails()}

        {/* Metadata */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('vault.created')}: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('vault.updated')}: {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {item.isDeleted ? (
            <>
              <Button
                mode="contained"
                icon="restore"
                onPress={handleRestore}
                style={styles.actionButton}
              >
                {t('vault.restore')}
              </Button>
              <Button
                mode="outlined"
                icon="delete-forever"
                onPress={handlePermanentDelete}
                loading={isDeleting}
                style={styles.actionButton}
              >
                {t('vault.deleteForever')}
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="contained"
                icon="pencil"
                onPress={handleEdit}
                style={styles.actionButton}
              >
                {t('common.edit')}
              </Button>
              <Button
                mode="outlined"
                icon={item.isFavorite ? 'star-off' : 'star'}
                onPress={handleToggleFavorite}
                style={styles.actionButton}
              >
                {item.isFavorite ? t('vault.unfavorite') : t('vault.favorite')}
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                onPress={handleDelete}
                loading={isDeleting}
                style={styles.actionButton}
              >
                {t('common.delete')}
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    marginBottom: 12,
  },
  field: {
    paddingVertical: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldValue: {
    flex: 1,
  },
  divider: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexGrow: 1,
  },
});
