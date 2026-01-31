/**
 * @file Vault Screen - Main vault list
 * @description Display and manage vault items
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { FAB, useTheme, Portal, Modal, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MD3Theme } from 'react-native-paper';

import { VaultItemList } from '@/components/vault';
import { Loading } from '@/components/ui';
import { useVault } from '@/hooks/useVault';
import { useClipboard } from '@/hooks/useClipboard';
import { useTranslation } from '@/i18n';
import type { DecryptedVaultItem, VaultItemType, PasswordEntry } from '@/types/vault.types';

export default function VaultScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { items, isLoading, isSyncing, sync, toggleFavorite } = useVault();
  const { copyPassword, copyUsername, isCopied, copiedLabel } = useClipboard();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<VaultItemType | 'all'>('all');
  const [fabOpen, setFabOpen] = useState(false);

  // Handle item press - navigate to detail
  const handleItemPress = useCallback(
    (item: DecryptedVaultItem) => {
      router.push({
        pathname: '/vault/[id]' as any,
        params: { id: item.id },
      });
    },
    [router]
  );

  // Handle copy action
  const handleCopy = useCallback(
    async (item: DecryptedVaultItem, field: 'password' | 'username' | 'url') => {
      if (item.type !== 'password') return;

      const data = item.data as PasswordEntry;

      if (field === 'password' && data.password) {
        await copyPassword(data.password);
      } else if (field === 'username' && data.username) {
        await copyUsername(data.username);
      }
    },
    [copyPassword, copyUsername]
  );

  // Handle toggle favorite
  const handleToggleFavorite = useCallback(
    async (item: DecryptedVaultItem) => {
      try {
        await toggleFavorite(item.id);
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      }
    },
    [toggleFavorite]
  );

  // Handle add new item
  const handleAddItem = useCallback(
    (type: VaultItemType) => {
      setFabOpen(false);
      router.push({
        pathname: '/vault/add' as any,
        params: { type },
      });
    },
    [router]
  );

  if (isLoading && items.length === 0) {
    return <Loading fullScreen message={t('vault.loadingVault')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={styles.content}>
        <VaultItemList
          items={items}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterType={filterType}
          onFilterChange={setFilterType}
          onItemPress={handleItemPress}
          onCopy={handleCopy}
          onToggleFavorite={handleToggleFavorite}
          onEmptyAction={() => handleAddItem('password')}
          showSearch
          showFilter
        />
      </View>

      {/* Copied notification */}
      {isCopied && (
        <View style={[styles.notification, { backgroundColor: theme.colors.inverseSurface }]}>
          <Text style={{ color: theme.colors.inverseOnSurface }}>
            {t('common.copiedToClipboard', { label: copiedLabel })}
          </Text>
        </View>
      )}

      {/* FAB Group for adding items */}
      <Portal>
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'key-variant',
              label: t('vault.itemTypes.password'),
              onPress: () => handleAddItem('password'),
            },
            {
              icon: 'note-text',
              label: t('vault.itemTypes.note'),
              onPress: () => handleAddItem('note'),
            },
            {
              icon: 'credit-card',
              label: t('vault.itemTypes.card'),
              onPress: () => handleAddItem('card'),
            },
            {
              icon: 'account',
              label: t('vault.itemTypes.identity'),
              onPress: () => handleAddItem('identity'),
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          fabStyle={{ backgroundColor: theme.colors.primaryContainer }}
          color={theme.colors.onPrimaryContainer}
        />
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  notification: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});
