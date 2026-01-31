/**
 * @file VaultItemList - Optimized list of vault items
 * @description FlashList-based vault items with sections and filtering
 */

import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, ViewStyle, FlatList, ScrollView } from 'react-native';
import { Searchbar, Chip, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import { VaultItemCard } from './VaultItemCard';
import { EmptyState, Loading } from '@/components/ui';
import { useTranslation } from '@/i18n';
import type { DecryptedVaultItem, VaultItemType, PasswordEntry } from '@/types/vault.types';

export interface VaultItemListProps {
  /** Vault items to display */
  items: DecryptedVaultItem[];
  /** Loading state */
  isLoading?: boolean;
  /** Search query */
  searchQuery?: string;
  /** Search change handler */
  onSearchChange?: (query: string) => void;
  /** Filter by type */
  filterType?: VaultItemType | 'all';
  /** Filter type change handler */
  onFilterChange?: (type: VaultItemType | 'all') => void;
  /** Item press handler */
  onItemPress?: (item: DecryptedVaultItem) => void;
  /** Item long press handler */
  onItemLongPress?: (item: DecryptedVaultItem) => void;
  /** Copy handler */
  onCopy?: (item: DecryptedVaultItem, field: 'password' | 'username' | 'url') => void;
  /** Favorite toggle handler */
  onToggleFavorite?: (item: DecryptedVaultItem) => void;
  /** Empty state action */
  onEmptyAction?: () => void;
  /** Show search bar */
  showSearch?: boolean;
  /** Show filter */
  showFilter?: boolean;
  /** Container style */
  style?: ViewStyle;
}

const FILTER_OPTIONS_KEYS = [
  { value: 'all', labelKey: 'vault.allItems' },
  { value: 'password', labelKey: 'vault.passwords' },
  { value: 'note', labelKey: 'vault.notes' },
  { value: 'card', labelKey: 'vault.cards' },
  { value: 'identity', labelKey: 'vault.identities' },
];

export function VaultItemList({
  items,
  isLoading = false,
  searchQuery = '',
  onSearchChange,
  filterType = 'all',
  onFilterChange,
  onItemPress,
  onItemLongPress,
  onCopy,
  onToggleFavorite,
  onEmptyAction,
  showSearch = true,
  showFilter = true,
  style,
}: VaultItemListProps) {
  const theme = useTheme<MD3Theme>();
  const { t } = useTranslation();

  // Filter items based on search and type
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((item) => item.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const data = item.data as { title?: string; username?: string; url?: string };
        const title = data.title?.toLowerCase() || '';
        const username = item.type === 'password' ? (data as PasswordEntry).username?.toLowerCase() || '' : '';
        const url = item.type === 'password' ? (data as PasswordEntry).url?.toLowerCase() || '' : '';
        return title.includes(query) || username.includes(query) || url.includes(query);
      });
    }

    return result;
  }, [items, filterType, searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: DecryptedVaultItem }) => (
      <VaultItemCard
        item={item}
        onPress={onItemPress}
        onLongPress={onItemLongPress}
        onCopy={onCopy}
        onToggleFavorite={onToggleFavorite}
      />
    ),
    [onItemPress, onItemLongPress, onCopy, onToggleFavorite]
  );

  const keyExtractor = useCallback((item: DecryptedVaultItem) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View style={styles.header}>
        {showSearch && onSearchChange && (
          <Searchbar
            placeholder={t('vault.searchPlaceholder')}
            value={searchQuery}
            onChangeText={onSearchChange}
            style={styles.searchBar}
          />
        )}

        {showFilter && onFilterChange && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {FILTER_OPTIONS_KEYS.map(opt => (
              <Chip
                key={opt.value}
                selected={filterType === opt.value}
                onPress={() => onFilterChange(opt.value as VaultItemType | 'all')}
                style={styles.filterChip}
                mode={filterType === opt.value ? 'flat' : 'outlined'}
              >
                {t(opt.labelKey)}
              </Chip>
            ))}
          </ScrollView>
        )}
      </View>
    ),
    [showSearch, searchQuery, onSearchChange, showFilter, filterType, onFilterChange, t]
  );

  const ListEmpty = useMemo(
    () => {
      if (isLoading) {
        return <Loading message={t('vault.loadingVault')} />;
      }

      if (searchQuery.trim()) {
        return (
          <EmptyState
            icon="magnify"
            title={t('vault.noResults')}
            description={t('vault.noResultsFor', { query: searchQuery })}
          />
        );
      }

      if (filterType !== 'all') {
        const typeLabels: Record<VaultItemType, string> = {
          password: t('vault.passwords').toLowerCase(),
          note: t('vault.notes').toLowerCase(),
          card: t('vault.cards').toLowerCase(),
          identity: t('vault.identities').toLowerCase(),
        };
        return (
          <EmptyState
            icon="folder-open"
            title={t('vault.noItemsOfType', { type: typeLabels[filterType] })}
            description={t('vault.noItemsOfTypeDesc', { type: typeLabels[filterType] })}
            actionLabel={t('vault.addFirst')}
            onAction={onEmptyAction}
          />
        );
      }

      return (
        <EmptyState
          icon="shield-lock"
          title={t('vault.emptyTitle')}
          description={t('vault.emptyDescription')}
          actionLabel={t('vault.addFirstItem')}
          onAction={onEmptyAction}
        />
      );
    },
    [isLoading, searchQuery, filterType, onEmptyAction, t]
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    // Each chip auto-sizes to its content
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
});

export default VaultItemList;
