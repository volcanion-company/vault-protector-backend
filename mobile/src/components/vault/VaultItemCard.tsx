/**
 * @file VaultItemCard - Vault item list card component
 * @description Displays vault item with icon, title, subtitle, and actions
 */

import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Card, Text, IconButton, useTheme, TouchableRipple } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MD3Theme } from 'react-native-paper';
import type { DecryptedVaultItem, VaultItemType, PasswordEntry, SecureNote, CardEntry, IdentityEntry } from '@/types/vault.types';

export interface VaultItemCardProps {
  /** Vault item data */
  item: DecryptedVaultItem;
  /** Press handler */
  onPress?: (item: DecryptedVaultItem) => void;
  /** Long press handler */
  onLongPress?: (item: DecryptedVaultItem) => void;
  /** Copy handler */
  onCopy?: (item: DecryptedVaultItem, field: 'password' | 'username' | 'url') => void;
  /** Favorite toggle handler */
  onToggleFavorite?: (item: DecryptedVaultItem) => void;
  /** Compact mode (less padding) */
  compact?: boolean;
  /** Container style */
  style?: ViewStyle;
}

// Icon mapping for item types
const TYPE_ICONS: Record<VaultItemType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  password: 'key-variant',
  note: 'note-text',
  card: 'credit-card',
  identity: 'account',
};

// Get subtitle based on item type
function getSubtitle(item: DecryptedVaultItem): string {
  switch (item.type) {
    case 'password': {
      const data = item.data as PasswordEntry;
      return data.username || data.url || '';
    }
    case 'note': {
      const data = item.data as SecureNote;
      // Show first line of note content
      const content = data.content || '';
      const firstLine = content.split('\n')[0];
      return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }
    case 'card': {
      const data = item.data as CardEntry;
      // Show masked card number
      const number = data.cardNumber || '';
      return number ? `•••• ${number.slice(-4)}` : '';
    }
    case 'identity': {
      const data = item.data as IdentityEntry;
      return [data.firstName, data.lastName].filter(Boolean).join(' ');
    }
    default:
      return '';
  }
}

export function VaultItemCard({
  item,
  onPress,
  onLongPress,
  onCopy,
  onToggleFavorite,
  compact = false,
  style,
}: VaultItemCardProps) {
  const theme = useTheme<MD3Theme>();

  const handlePress = useCallback(() => {
    onPress?.(item);
  }, [item, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(item);
  }, [item, onLongPress]);

  const handleCopyPassword = useCallback(() => {
    onCopy?.(item, 'password');
  }, [item, onCopy]);

  const handleCopyUsername = useCallback(() => {
    onCopy?.(item, 'username');
  }, [item, onCopy]);

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite?.(item);
  }, [item, onToggleFavorite]);

  const icon = TYPE_ICONS[item.type];
  const subtitle = useMemo(() => getSubtitle(item), [item]);
  const showCopyActions = item.type === 'password' && onCopy;

  return (
    <TouchableRipple
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[styles.container, style]}
    >
      <View style={[styles.content, compact && styles.contentCompact]}>
        {/* Left icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={24}
            color={theme.colors.primary}
          />
        </View>

        {/* Text content */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              variant="titleMedium"
              numberOfLines={1}
              style={styles.title}
            >
              {(item.data as { title: string }).title}
            </Text>
            {item.isFavorite && (
              <MaterialCommunityIcons
                name="star"
                size={16}
                color={theme.colors.primary}
                style={styles.favoriteIcon}
              />
            )}
          </View>
          {subtitle ? (
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {showCopyActions && (
            <>
              <IconButton
                icon="account"
                size={20}
                onPress={handleCopyUsername}
                accessibilityLabel="Copy username"
              />
              <IconButton
                icon="key"
                size={20}
                onPress={handleCopyPassword}
                accessibilityLabel="Copy password"
              />
            </>
          )}
          {onToggleFavorite && (
            <IconButton
              icon={item.isFavorite ? 'star' : 'star-outline'}
              size={20}
              onPress={handleToggleFavorite}
              accessibilityLabel={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            />
          )}
        </View>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 4,
  },
  contentCompact: {
    padding: 8,
    paddingRight: 0,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontWeight: '500',
  },
  favoriteIcon: {
    marginLeft: 4,
  },
  subtitle: {
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default VaultItemCard;
