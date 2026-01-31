import { create } from 'zustand';
import type { DecryptedVaultItem, VaultItemType, SyncMetadata } from '@/types';

interface VaultFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

interface VaultState {
  items: DecryptedVaultItem[];
  folders: VaultFolder[];
  version: number;
  localChecksum: string | null;
  isLoading: boolean;
  error: string | null;
  syncMetadata: SyncMetadata;
  searchQuery: string;
  selectedType: VaultItemType | 'all';
  showFavoritesOnly: boolean;
}

interface VaultActions {
  setItems: (items: DecryptedVaultItem[]) => void;
  addItem: (item: DecryptedVaultItem) => void;
  updateItem: (id: string, item: Partial<DecryptedVaultItem>) => void;
  deleteItem: (id: string) => void;
  setFolders: (folders: VaultFolder[]) => void;
  setVersion: (version: number) => void;
  setLocalChecksum: (checksum: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSyncMetadata: (metadata: Partial<SyncMetadata>) => void;
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: VaultItemType | 'all') => void;
  setShowFavoritesOnly: (show: boolean) => void;
  clearVault: () => void;
  // Convenience getters/setters for lastSyncTime
  lastSyncTime: string | null;
  setLastSyncTime: (time: string | null) => void;
}

type VaultStore = VaultState & VaultActions;

const initialState: VaultState = {
  items: [],
  folders: [],
  version: 0,
  localChecksum: null,
  isLoading: false,
  error: null,
  syncMetadata: {
    lastSyncAt: null,
    serverVersion: 0,
    etag: null,
  },
  searchQuery: '',
  selectedType: 'all',
  showFavoritesOnly: false,
};

export const useVaultStore = create<VaultStore>((set, get) => ({
  ...initialState,

  setItems: (items) => set({ items }),

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  deleteItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  setFolders: (folders) => set({ folders }),

  setVersion: (version) => set({ version }),

  setLocalChecksum: (localChecksum) => set({ localChecksum }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setSyncMetadata: (metadata) =>
    set((state) => ({
      syncMetadata: { ...state.syncMetadata, ...metadata },
    })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setSelectedType: (selectedType) => set({ selectedType }),

  setShowFavoritesOnly: (showFavoritesOnly) => set({ showFavoritesOnly }),

  clearVault: () => set(initialState),

  // Convenience getter for lastSyncTime
  get lastSyncTime() {
    return get().syncMetadata.lastSyncAt;
  },

  // Convenience setter for lastSyncTime
  setLastSyncTime: (time: string | null) =>
    set((state) => ({
      syncMetadata: { ...state.syncMetadata, lastSyncAt: time },
    })),
}));

// Selectors
export const selectFilteredItems = (state: VaultStore) => {
  let items = state.items;

  // Filter by type
  if (state.selectedType !== 'all') {
    items = items.filter((item) => item.type === state.selectedType);
  }

  // Filter favorites
  if (state.showFavoritesOnly) {
    items = items.filter((item) => 'favorite' in item.data && item.data.favorite);
  }

  // Search filter
  if (state.searchQuery.trim()) {
    const query = state.searchQuery.toLowerCase();
    items = items.filter((item) => {
      const data = item.data;
      if ('title' in data && data.title.toLowerCase().includes(query)) return true;
      if ('username' in data && data.username?.toLowerCase().includes(query)) return true;
      if ('url' in data && data.url?.toLowerCase().includes(query)) return true;
      if ('tags' in data && data.tags.some((tag: string) => tag.toLowerCase().includes(query))) return true;
      return false;
    });
  }

  return items;
};
