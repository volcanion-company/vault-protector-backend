# Vault Protector — Mobile App (React Native Expo)

## 1) Tổng quan

Ứng dụng mobile Vault Protector được xây dựng bằng **React Native** với **Expo**, cho phép người dùng quản lý mật khẩu và dữ liệu nhạy cảm trên thiết bị di động với trải nghiệm native, bảo mật cao và khả năng hoạt động offline.

### 1.1 Mục tiêu chính
- **Cross-platform**: Một codebase TypeScript cho cả iOS và Android
- **Offline-first**: Hoạt động đầy đủ khi không có mạng
- **Bảo mật native**: Tích hợp sâu với hệ thống bảo mật của OS thông qua Expo modules
- **UX mượt mà**: Trải nghiệm người dùng nhanh, trực quan
- **Developer Experience**: Hot reload, OTA updates, EAS Build

### 1.2 Nền tảng hỗ trợ
| Platform | Phiên bản tối thiểu |
|----------|---------------------|
| iOS      | 13.4+               |
| Android  | API 23 (6.0)+       |
| Expo SDK | 52+                 |

---

## 2) Tính năng chính

### 2.1 Xác thực & Bảo mật

#### Biometric Unlock
- **iOS**: Face ID, Touch ID
- **Android**: Fingerprint, Face Recognition, Iris Scanner
- Fallback về Master Password khi biometric thất bại
- Cấu hình cho phép/tắt biometric unlock

#### Master Password
- Nhập Master Password khi mở app lần đầu sau khi cài đặt
- Tùy chọn yêu cầu nhập lại sau khoảng thời gian nhất định
- Kiểm tra độ mạnh mật khẩu khi tạo tài khoản

#### Auto-lock
- Tự động khóa app khi:
  - Chuyển sang background (cấu hình delay: ngay lập tức / 30s / 1 phút / 5 phút)
  - Timeout không hoạt động (cấu hình: 1 / 5 / 15 / 30 phút)
  - Khóa màn hình thiết bị
- Xóa clipboard khi khóa app

### 2.2 Quản lý Vault

#### Vault Items
- **Password Entry**
  - Title, Username, Password, URL, Notes, Tags
  - Hiển thị favicon từ URL
  - Copy nhanh username/password
  - Mở URL trong browser
- **Secure Note**
  - Ghi chú bảo mật với rich text cơ bản
- **TOTP (2FA)** *(Phase 2)*
  - Quét QR code để thêm
  - Hiển thị mã OTP với countdown
- **File Attachment** *(Phase 2)*
  - Đính kèm file với giới hạn dung lượng
  - Mã hóa file trước khi lưu

#### Tổ chức & Tìm kiếm
- **Folders/Categories**: Phân loại items
- **Tags**: Gắn nhiều tags cho mỗi item
- **Favorites**: Đánh dấu items quan trọng
- **Search**: Tìm kiếm client-side trong tất cả fields
- **Sort**: Theo tên, ngày tạo, ngày sửa, lần sử dụng gần nhất

### 2.3 Password Generator
- **Cấu hình**:
  - Độ dài: 8-128 ký tự
  - Bao gồm: Chữ hoa, chữ thường, số, ký tự đặc biệt
  - Loại trừ ký tự dễ nhầm: `0O1lI`
  - Chế độ dễ đọc (pronounceable)
- **Lịch sử**: Lưu các mật khẩu đã generate gần đây
- **Copy to clipboard**: Tự động xóa sau timeout

### 2.4 Đồng bộ (Sync)

#### Sync Strategy
- **Pull-based**: App chủ động pull changes từ server
- **Conflict resolution**: Last-write-wins với version number
- **Delta sync**: Chỉ sync items thay đổi (Phase 2)

#### Sync Triggers
- Khi mở app (nếu có mạng)
- Manual pull-to-refresh
- Sau mỗi thay đổi local (debounced)
- Background sync định kỳ (nếu OS cho phép)

### 2.5 Autofill *(Phase 2)*

#### iOS - Password AutoFill Extension
- Tích hợp với iOS AutoFill framework
- Xuất hiện trong keyboard suggestions
- Yêu cầu Associated Domains configuration
- Hỗ trợ Safari và các app khác

#### Android - Autofill Service
- Implement `AutofillService`
- Hiển thị suggestions trong các form đăng nhập
- Hỗ trợ Chrome và các app khác
- Save prompt khi phát hiện credentials mới

### 2.6 Security Features

#### Clipboard Management
- Copy password/username với 1 tap
- Tự động xóa clipboard sau: 30s / 1 phút / 2 phút (cấu hình)
- Notification khi clipboard được xóa

#### Screenshot Prevention
- Chặn screenshot trong app (Android: `FLAG_SECURE`)
- iOS: Blur content khi vào app switcher

#### Jailbreak/Root Detection
- Cảnh báo khi phát hiện thiết bị đã jailbreak/root
- Tùy chọn chặn hoàn toàn hoặc chỉ cảnh báo

---

## 3) Kiến trúc kỹ thuật

### 3.1 Cấu trúc thư mục
```
mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Auth group routes
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── vault/
│   │   │   ├── index.tsx         # Vault list
│   │   │   ├── [id].tsx          # Vault item detail
│   │   │   └── _layout.tsx
│   │   ├── generator.tsx
│   │   ├── settings.tsx
│   │   └── _layout.tsx
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Entry/splash
├── src/
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   ├── vault/                # Vault-specific components
│   │   │   ├── VaultItem.tsx
│   │   │   ├── VaultList.tsx
│   │   │   └── VaultForm.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Loading.tsx
│   │       └── ErrorBoundary.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBiometric.ts
│   │   ├── useClipboard.ts
│   │   ├── useVault.ts
│   │   └── useSync.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts         # Axios instance
│   │   │   ├── auth.api.ts
│   │   │   ├── vault.api.ts
│   │   │   └── interceptors.ts
│   │   ├── crypto/
│   │   │   ├── index.ts
│   │   │   ├── keyDerivation.ts
│   │   │   ├── encryption.ts
│   │   │   └── types.ts
│   │   ├── storage/
│   │   │   ├── secureStorage.ts
│   │   │   ├── database.ts
│   │   │   └── mmkv.ts
│   │   └── sync/
│   │       ├── syncManager.ts
│   │       └── offlineQueue.ts
│   ├── stores/                   # Zustand stores
│   │   ├── authStore.ts
│   │   ├── vaultStore.ts
│   │   ├── settingsStore.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── vault.types.ts
│   │   ├── auth.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   └── config/
│       ├── env.ts
│       └── theme.ts
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── __tests__/
│   ├── components/
│   ├── hooks/
│   └── services/
├── app.json
├── eas.json
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── package.json
└── README.md
```

### 3.2 State Management
- **Zustand** cho global state (lightweight, TypeScript-friendly)
- **TanStack Query (React Query)** cho server state & caching
- **React Context** cho theme và auth state
- **MMKV** cho persisted state (settings, preferences)

### 3.3 Navigation
- **Expo Router v3** (file-based routing)
- Deep linking support built-in
- Type-safe navigation với TypeScript
- Stack, Tab, và Drawer navigators

---

## 4) Lưu trữ dữ liệu (Local Storage)

### 4.1 Secure Storage
**Package**: `expo-secure-store`

**Dữ liệu lưu trữ**:
- Encrypted Master Key (wrapped)
- Vault Key (wrapped by Master Key)
- Biometric key reference
- Session tokens (access token, refresh token)

**Platform-specific**:
- **iOS**: Keychain Services với `kSecAttrAccessible`
- **Android**: Android Keystore System + EncryptedSharedPreferences

**Giới hạn**: 2KB per item → Phù hợp cho keys và tokens

### 4.2 Fast Key-Value Storage
**Package**: `react-native-mmkv`

**Use cases**:
- User preferences
- App settings
- Cache metadata
- Feature flags

**Ưu điểm**: ~30x faster than AsyncStorage

### 4.3 Database
**Options**:
| Package | Ưu điểm | Nhược điểm |
|---------|---------|------------|
| **WatermelonDB** | Lazy loading, sync-friendly, SQLite-based | Setup phức tạp |
| **Realm** | Fast, offline-first, encryption built-in | Bundle size lớn |
| **expo-sqlite** | Native SQLite, Expo managed | Cần manual encryption |
| **DrizzleORM + expo-sqlite** | Type-safe, migrations, modern API | Relatively new |

**Khuyến nghị**: **DrizzleORM + expo-sqlite** với SQLCipher cho encryption

### 4.4 Cấu trúc dữ liệu local
```typescript
// types/vault.types.ts

export interface VaultItem {
  id: string;
  type: 'password' | 'note' | 'card' | 'identity';
  encryptedData: string; // JSON encrypted
  version: number;
  createdAt: string; // ISO date
  updatedAt: string;
  isSynced: boolean;
  isDeleted: boolean; // soft delete for sync
}

export interface SyncMetadata {
  lastSyncAt: string | null;
  serverVersion: number;
  etag: string | null;
}

// Decrypted password entry
export interface PasswordEntry {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  tags: string[];
  favorite: boolean;
}
```

---

## 5) Mã hóa (Encryption)

### 5.1 Thư viện Crypto
**Packages**:
- `expo-crypto` - Basic hashing, random bytes
- `react-native-quick-crypto` - Node.js crypto API (OpenSSL-based, fast)
- `@noble/ciphers` - Pure JS AES-GCM, XChaCha20
- `@noble/hashes` - SHA256, HKDF, PBKDF2
- `argon2-browser` hoặc `react-native-argon2` - Argon2id KDF

**Thuật toán**:
- **KDF**: Argon2id (memory: 64MB, iterations: 3, parallelism: 4)
- **Symmetric Encryption**: AES-256-GCM
- **Key Derivation**: HKDF-SHA256

### 5.2 Key Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Master Password                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Argon2id(MP, salt) → Master Key                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           Decrypt wrappedVaultKey → Vault Key               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Decrypt vaultBlob → Plain Data                 │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Crypto Service Implementation
```typescript
// services/crypto/encryption.ts
import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from 'expo-crypto';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';

const IV_LENGTH = 12;
const KEY_LENGTH = 32;

export async function encrypt(
  plaintext: string,
  key: Uint8Array
): Promise<string> {
  const iv = await randomBytes(IV_LENGTH);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const cipher = gcm(key, iv);
  const ciphertext = cipher.encrypt(data);
  
  // Combine IV + ciphertext + tag
  const result = new Uint8Array(iv.length + ciphertext.length);
  result.set(iv);
  result.set(ciphertext, iv.length);
  
  return Buffer.from(result).toString('base64');
}

export async function decrypt(
  encryptedData: string,
  key: Uint8Array
): Promise<string> {
  const data = Buffer.from(encryptedData, 'base64');
  const iv = data.slice(0, IV_LENGTH);
  const ciphertext = data.slice(IV_LENGTH);
  
  const cipher = gcm(key, iv);
  const plaintext = cipher.decrypt(ciphertext);
  
  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

export function deriveKey(
  masterKey: Uint8Array,
  purpose: string
): Uint8Array {
  return hkdf(sha256, masterKey, undefined, purpose, KEY_LENGTH);
}
```

### 5.4 Biometric Key Derivation
```typescript
// services/crypto/biometric.ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_KEY = 'biometric_vault_key';

export async function enableBiometric(vaultKey: Uint8Array): Promise<boolean> {
  // 1. Check biometric availability
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (!hasHardware || !isEnrolled) return false;
  
  // 2. Generate random biometric key
  const biometricKey = await randomBytes(32);
  
  // 3. Encrypt vault key with biometric key
  const encryptedVaultKey = await encrypt(
    Buffer.from(vaultKey).toString('base64'),
    biometricKey
  );
  
  // 4. Store biometric key in secure enclave
  await SecureStore.setItemAsync(BIOMETRIC_KEY, 
    Buffer.from(biometricKey).toString('base64'),
    { requireAuthentication: true }
  );
  
  // 5. Store encrypted vault key
  await SecureStore.setItemAsync('encrypted_vault_key', encryptedVaultKey);
  
  return true;
}

export async function unlockWithBiometric(): Promise<Uint8Array | null> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Vault Protector',
    fallbackLabel: 'Use Master Password',
  });
  
  if (!result.success) return null;
  
  const biometricKeyBase64 = await SecureStore.getItemAsync(BIOMETRIC_KEY);
  const encryptedVaultKey = await SecureStore.getItemAsync('encrypted_vault_key');
  
  if (!biometricKeyBase64 || !encryptedVaultKey) return null;
  
  const biometricKey = Buffer.from(biometricKeyBase64, 'base64');
  const vaultKeyBase64 = await decrypt(encryptedVaultKey, biometricKey);
  
  return Buffer.from(vaultKeyBase64, 'base64');
}
```

---

## 6) Network & API Integration

### 6.1 HTTP Client
**Package**: `axios` + `@tanstack/react-query`

**Features**:
- Request/Response interceptors
- Retry logic với exponential backoff
- Token refresh tự động
- Request cancellation
- Caching và background refetch

### 6.2 API Client Setup
```typescript
// services/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/config/env';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        
        await SecureStore.setItemAsync('access_token', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        throw refreshError;
      }
    }
    
    throw error;
  }
);

export default apiClient;
```

### 6.3 API Endpoints
```typescript
// services/api/endpoints.ts
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    SALT: '/auth/salt', // Get salt for email
  },
  
  // Vault
  VAULT: {
    GET: '/vault',
    UPDATE: '/vault',
    SYNC: '/vault/sync',
  },
  
  // Devices
  DEVICES: {
    LIST: '/me/devices',
    DELETE: (id: string) => `/me/devices/${id}`,
  },
  
  // Sessions
  SESSIONS: {
    LIST: '/me/sessions',
    DELETE: (id: string) => `/me/sessions/${id}`,
  },
} as const;
```

### 6.4 TanStack Query Setup
```typescript
// services/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

// Auto refetch on reconnect
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 2,
    },
  },
});
```

### 6.5 Offline Handling
```typescript
// services/sync/offlineQueue.ts
import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

const storage = new MMKV({ id: 'offline-queue' });

interface QueuedOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  payload: any;
  timestamp: number;
}

export const offlineQueue = {
  add(operation: Omit<QueuedOperation, 'id' | 'timestamp'>) {
    const queue = this.getAll();
    const newOp: QueuedOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    queue.push(newOp);
    storage.set('queue', JSON.stringify(queue));
  },
  
  getAll(): QueuedOperation[] {
    const data = storage.getString('queue');
    return data ? JSON.parse(data) : [];
  },
  
  remove(id: string) {
    const queue = this.getAll().filter((op) => op.id !== id);
    storage.set('queue', JSON.stringify(queue));
  },
  
  async processQueue() {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return;
    
    const queue = this.getAll();
    for (const operation of queue) {
      try {
        // Process operation...
        this.remove(operation.id);
      } catch (error) {
        console.error('Failed to process:', operation.id);
      }
    }
  },
};
```

---

## 7) UI/UX Design

### 7.1 Design System
- **React Native Paper** hoặc **Tamagui** cho UI components
- **Expo Vector Icons** cho icons
- Dark mode / Light mode / System default
- Accessible: hỗ trợ screen readers, đủ contrast ratio
- Responsive design với **react-native-responsive-screen**

### 7.2 Theme Configuration
```typescript
// src/config/theme.ts
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    background: '#FFFBFE',
    surface: '#FFFBFE',
    error: '#B3261E',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    secondary: '#CCC2DC',
    background: '#1C1B1F',
    surface: '#1C1B1F',
    error: '#F2B8B5',
  },
};
```

### 7.3 Màn hình chính

#### Onboarding
- Welcome screens với Lottie animations
- Create account / Sign in options
- Biometric setup prompt

#### Login Screen
```typescript
// app/(auth)/login.tsx
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useBiometric } from '@/hooks/useBiometric';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const { isBiometricEnabled, authenticateWithBiometric } = useBiometric();

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge">Vault Protector</Text>
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        label="Master Password"
        value={masterPassword}
        onChangeText={setMasterPassword}
        secureTextEntry
      />
      
      <Button mode="contained" onPress={handleLogin}>
        Unlock
      </Button>
      
      {isBiometricEnabled && (
        <Button 
          mode="outlined" 
          icon="fingerprint"
          onPress={authenticateWithBiometric}
        >
          Use Biometric
        </Button>
      )}
    </View>
  );
}
```

#### Vault List
- Search bar sticky ở top với **react-native-keyboard-aware-scroll-view**
- Filter chips (All, Favorites, Tags)
- FlashList cho performance với large lists
- FAB để thêm item mới
- Pull-to-refresh với TanStack Query

#### Vault Item Detail
- View mode với copy buttons
- Edit mode với react-hook-form validation
- Delete với confirmation modal
- Password visibility toggle

#### Password Generator
```typescript
// app/(tabs)/generator.tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Text, Button, Chip, Slider } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useClipboard } from '@/hooks/useClipboard';

export default function GeneratorScreen() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const { copyWithTimeout } = useClipboard();

  const generate = () => {
    // Generate password based on options
  };

  return (
    <View>
      <Text variant="displaySmall" style={styles.password}>
        {password || 'Tap Generate'}
      </Text>
      
      <Slider value={length} onValueChange={setLength} min={8} max={64} />
      <Text>Length: {length}</Text>
      
      <View style={styles.chips}>
        <Chip selected={options.uppercase}>ABC</Chip>
        <Chip selected={options.lowercase}>abc</Chip>
        <Chip selected={options.numbers}>123</Chip>
        <Chip selected={options.symbols}>!@#</Chip>
      </View>
      
      <Button mode="contained" onPress={generate}>Generate</Button>
      <Button mode="outlined" onPress={() => copyWithTimeout(password)}>
        Copy
      </Button>
    </View>
  );
}
```

#### Settings
- Account info
- Security settings (biometric, auto-lock timeout)
- Sync settings
- Appearance (theme selector)
- Sessions & Devices management
- About & Help
- Logout với confirmation

### 7.4 Navigation Structure
```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { isAuthenticated, isLocked } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="(auth)" />
      ) : isLocked ? (
        <Stack.Screen name="lock" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}

// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => (
            <Ionicons name="lock-closed" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="generator"
        options={{
          title: 'Generator',
          tabBarIcon: ({ color }) => (
            <Ionicons name="key" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## 8) Testing Strategy

### 8.1 Unit Tests
**Framework**: Jest + React Native Testing Library

```typescript
// __tests__/services/crypto.test.ts
import { encrypt, decrypt, deriveKey } from '@/services/crypto';

describe('Encryption', () => {
  const testKey = new Uint8Array(32).fill(1);
  
  it('should encrypt and decrypt correctly', async () => {
    const plaintext = 'Hello, Vault!';
    const encrypted = await encrypt(plaintext, testKey);
    const decrypted = await decrypt(encrypted, testKey);
    
    expect(decrypted).toBe(plaintext);
  });
  
  it('should produce different ciphertext for same plaintext', async () => {
    const plaintext = 'Same text';
    const encrypted1 = await encrypt(plaintext, testKey);
    const encrypted2 = await encrypt(plaintext, testKey);
    
    expect(encrypted1).not.toBe(encrypted2);
  });
});
```

### 8.2 Component Tests
```typescript
// __tests__/components/VaultItem.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { VaultItem } from '@/components/vault/VaultItem';

describe('VaultItem', () => {
  const mockItem = {
    id: '1',
    title: 'Test Account',
    username: 'user@test.com',
    type: 'password',
  };

  it('should render item title', () => {
    const { getByText } = render(<VaultItem item={mockItem} />);
    expect(getByText('Test Account')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <VaultItem item={mockItem} onPress={onPress} />
    );
    
    fireEvent.press(getByTestId('vault-item'));
    expect(onPress).toHaveBeenCalledWith(mockItem);
  });
});
```

### 8.3 E2E Tests
**Framework**: Maestro hoặc Detox

```yaml
# .maestro/login-flow.yaml
appId: com.vaultprotector.app
---
- launchApp
- tapOn: "Sign In"
- tapOn:
    id: "email-input"
- inputText: "test@example.com"
- tapOn:
    id: "password-input"
- inputText: "TestPassword123!"
- tapOn: "Unlock"
- assertVisible: "Vault"
```

### 8.4 Security Testing
- Static analysis với `eslint-plugin-security`
- Dependency audit với `npm audit`
- Penetration testing (manual)
- Certificate pinning verification

---

## 9) CI/CD Pipeline

### 9.1 EAS Build Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "developer@vaultprotector.com",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 9.2 GitHub Actions Workflow
```yaml
# .github/workflows/mobile.yml
name: Mobile CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'mobile/**'
  pull_request:
    branches: [main]
    paths:
      - 'mobile/**'

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./mobile
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-preview:
    needs: lint-and-test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build Preview
        working-directory: ./mobile
        run: eas build --platform all --profile preview --non-interactive

  build-production:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build Production
        working-directory: ./mobile
        run: eas build --platform all --profile production --non-interactive
      
      - name: Submit to stores
        working-directory: ./mobile
        run: eas submit --platform all --profile production --non-interactive
```

### 9.3 OTA Updates
```typescript
// App.tsx - Check for updates
import * as Updates from 'expo-updates';

async function checkForUpdates() {
  if (__DEV__) return;
  
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}
```

---

## 10) Platform-specific Considerations

### 10.1 iOS Configuration
```json
// app.json - iOS specific
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.vaultprotector.app",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSFaceIDUsageDescription": "Use Face ID to unlock your vault",
        "NSCameraUsageDescription": "Scan QR codes for 2FA setup",
        "UIBackgroundModes": ["fetch"]
      },
      "entitlements": {
        "com.apple.developer.associated-domains": [
          "applinks:vaultprotector.com",
          "webcredentials:vaultprotector.com"
        ]
      },
      "config": {
        "usesNonExemptEncryption": true
      }
    }
  }
}
```

**iOS Specifics**:
- **Minimum iOS 13.4**: Required for Expo SDK 52+
- **App Groups**: Cho AutoFill extension sharing data
- **Associated Domains**: Cho password autofill matching
- **Background Fetch**: Cho sync định kỳ
- **Keychain Sharing**: Giữa main app và extension

### 10.2 Android Configuration
```json
// app.json - Android specific
{
  "expo": {
    "android": {
      "package": "com.vaultprotector.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#6750A4"
      },
      "permissions": [
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ],
      "blockedPermissions": [
        "android.permission.RECORD_AUDIO"
      ]
    }
  }
}
```

**Android Specifics**:
- **Minimum API 23**: Fingerprint API available
- **Autofill Framework**: API 26+ (yêu cầu native module)
- **Biometric API**: expo-local-authentication
- **WorkManager**: Cho background sync (expo-background-fetch)
- **FLAG_SECURE**: Prevent screenshots

```typescript
// Prevent screenshots on Android
import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';

export function usePreventScreenCapture() {
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);
}
```

### 10.3 Expo Config Plugins
```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Vault Protector',
  slug: 'vault-protector',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#6750A4',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-local-authentication',
    'expo-screen-capture',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 23,
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          buildToolsVersion: '34.0.0',
        },
        ios: {
          deploymentTarget: '13.4',
        },
      },
    ],
  ],
});
```

---

## 11) Dependencies chính

```json
// package.json
{
  "name": "vault-protector-mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json}\""
  },
  "dependencies": {
    // Expo Core
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-constants": "~17.0.0",
    "expo-linking": "~7.0.0",
    "expo-updates": "~0.26.0",
    
    // Security & Crypto
    "expo-secure-store": "~14.0.0",
    "expo-local-authentication": "~15.0.0",
    "expo-crypto": "~14.0.0",
    "expo-screen-capture": "~7.0.0",
    "@noble/ciphers": "^0.6.0",
    "@noble/hashes": "^1.4.0",
    "react-native-argon2": "^2.0.0",
    
    // Storage
    "react-native-mmkv": "^3.0.0",
    "expo-sqlite": "~15.0.0",
    "drizzle-orm": "^0.35.0",
    
    // Network & State
    "axios": "^1.7.0",
    "@tanstack/react-query": "^5.50.0",
    "zustand": "^5.0.0",
    "@react-native-community/netinfo": "^11.0.0",
    
    // UI Components
    "react-native-paper": "^5.12.0",
    "react-native-safe-area-context": "^4.10.0",
    "react-native-screens": "~4.0.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "@shopify/flash-list": "^1.7.0",
    "react-native-keyboard-aware-scroll-view": "^0.9.5",
    
    // Forms & Validation
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0",
    
    // Utils
    "date-fns": "^4.0.0",
    "uuid": "^10.0.0",
    "expo-clipboard": "~7.0.0",
    "expo-haptics": "~14.0.0",
    
    // React & React Native
    "react": "18.3.1",
    "react-native": "0.76.0"
  },
  "devDependencies": {
    // TypeScript
    "@types/react": "~18.3.0",
    "@types/uuid": "^10.0.0",
    "typescript": "~5.6.0",
    
    // Testing
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "@testing-library/react-native": "^12.7.0",
    "@testing-library/jest-native": "^5.4.3",
    
    // Linting & Formatting
    "eslint": "^8.57.0",
    "eslint-config-expo": "~8.0.0",
    "eslint-plugin-security": "^3.0.0",
    "prettier": "^3.3.0",
    
    // Database
    "drizzle-kit": "^0.28.0",
    
    // Build Tools
    "expo-build-properties": "~0.13.0",
    "@babel/core": "^7.25.0"
  }
}
```

### 11.1 Key Dependencies Explained

| Package | Purpose |
|---------|---------|
| `expo-router` | File-based routing, deep linking |
| `expo-secure-store` | iOS Keychain / Android Keystore |
| `expo-local-authentication` | Biometric authentication |
| `@noble/ciphers` | AES-GCM encryption (audited) |
| `@noble/hashes` | SHA256, HKDF (audited) |
| `react-native-mmkv` | Ultra-fast key-value storage |
| `drizzle-orm` | Type-safe SQL với migrations |
| `zustand` | Lightweight state management |
| `@tanstack/react-query` | Server state, caching, sync |
| `react-native-paper` | Material Design 3 components |
| `@shopify/flash-list` | Performant list rendering |
| `zod` | Runtime validation (shared với backend) |

---

## 12) Roadmap triển khai Mobile

### Phase 1: Foundation (2-3 tuần)
- [ ] Expo project setup với TypeScript
- [ ] Cấu trúc thư mục theo clean architecture
- [ ] Expo Router navigation setup
- [ ] Theme configuration (light/dark)
- [ ] Core crypto module (@noble/ciphers, @noble/hashes)
- [ ] Secure storage integration (expo-secure-store)
- [ ] MMKV setup cho settings
- [ ] API client với axios + interceptors
- [ ] TanStack Query configuration

### Phase 2: Authentication (1-2 tuần)
- [ ] Login screen UI
- [ ] Register screen UI
- [ ] Master password input với strength indicator
- [ ] Auth store (Zustand)
- [ ] Key derivation (Argon2id)
- [ ] Biometric unlock setup
- [ ] Auto-lock functionality với AppState
- [ ] Session token management

### Phase 3: Database & Vault Core (2-3 tuần)
- [ ] DrizzleORM + expo-sqlite setup
- [ ] Database schema và migrations
- [ ] Vault store (Zustand + persist)
- [ ] Vault list screen với FlashList
- [ ] Search và filter functionality
- [ ] Add/Edit vault item với react-hook-form
- [ ] Delete với confirmation
- [ ] Favorites và tags
- [ ] Copy to clipboard với timeout

### Phase 4: Sync (1-2 tuần)
- [ ] Sync manager service
- [ ] Pull sync từ server
- [ ] Push local changes
- [ ] Conflict resolution (version-based)
- [ ] Offline queue với MMKV
- [ ] Background sync (expo-background-fetch)
- [ ] Sync status indicator

### Phase 5: Generator & Utilities (1 tuần)
- [ ] Password generator screen
- [ ] Generator options (length, charset)
- [ ] Password strength checker
- [ ] Password history
- [ ] Export vault (encrypted JSON)
- [ ] Import vault

### Phase 6: Polish & Security (1-2 tuần)
- [ ] UI/UX refinements
- [ ] Animations với Reanimated
- [ ] Screenshot prevention (expo-screen-capture)
- [ ] Haptic feedback
- [ ] Error boundaries
- [ ] Loading states và skeletons
- [ ] Empty states
- [ ] Security audit
- [ ] Performance optimization

### Phase 7: Production Ready (1 tuần)
- [ ] EAS Build configuration
- [ ] App icons và splash screen
- [ ] OTA updates setup
- [ ] Sentry error tracking
- [ ] Analytics (optional)
- [ ] App Store assets
- [ ] Privacy policy và terms

### Phase 8: Autofill *(Phase 2 của product)*
- [ ] iOS AutoFill extension (native module)
- [ ] Android Autofill Service (native module)
- [ ] Domain matching logic
- [ ] Associated Domains configuration

---

## 13) Rủi ro & Giải pháp

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| Crypto performance trên low-end devices | Medium | Tune Argon2 parameters, Web Workers nếu cần |
| Expo managed workflow limitations | Medium | Sử dụng config plugins, hoặc eject nếu cần native modules |
| Biometric API inconsistency across devices | Medium | Abstraction layer, extensive testing trên nhiều devices |
| Background sync bị kill | Low | expo-background-fetch với retry logic |
| AutoFill complexity | High | Defer to Phase 2, yêu cầu native modules |
| App Store rejection | Medium | Follow guidelines strictly, prepare appeals |
| Data migration khi update | Medium | DrizzleORM migrations, version schema |
| Bundle size quá lớn | Medium | Lazy loading, tree shaking, monitor với `npx expo-doctor` |
| OTA update failures | Low | Rollback strategy, gradual rollout |
| Third-party package compatibility | Medium | Lock versions, test trước khi upgrade |

---

## 14) Security Checklist

### Crypto & Keys
- [ ] Master Password không bao giờ lưu plaintext
- [ ] Vault Key chỉ tồn tại trong memory khi app active
- [ ] Sử dụng crypto libraries đã được audit (@noble/*)
- [ ] Secure random number generation (expo-crypto)
- [ ] Argon2id với parameters phù hợp

### Storage
- [ ] Sensitive data trong expo-secure-store
- [ ] Database encryption (SQLCipher)
- [ ] Clear sensitive data khi app vào background
- [ ] Không log sensitive data

### Network
- [ ] HTTPS only
- [ ] Certificate pinning (production)
- [ ] Token refresh flow secure
- [ ] Request/Response không chứa secrets trong logs

### Runtime
- [ ] Screenshot prevention (expo-screen-capture)
- [ ] Clipboard auto-clear
- [ ] Auto-lock khi background/inactive
- [ ] Biometric với requireAuthentication

### Build & Deploy
- [ ] ProGuard/R8 obfuscation (Android)
- [ ] Hermes engine enabled
- [ ] Remove console.log in production
- [ ] Environment variables không hardcode
- [ ] Code signing certificates secure

### Validation
- [ ] Input validation với Zod
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention trong WebView (nếu có)

### Monitoring
- [ ] Error tracking (Sentry) không capture sensitive data
- [ ] Security audit định kỳ
- [ ] Dependency vulnerability scanning

---

## 15) Tài liệu tham khảo

### Expo & React Native
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

### Security
- [Expo Security Guidelines](https://docs.expo.dev/guides/security/)
- [OWASP Mobile Security Testing Guide](https://owasp.org/www-project-mobile-security-testing-guide/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)
- [@noble/ciphers (Audited Crypto)](https://github.com/paulmillr/noble-ciphers)

### State Management & Data
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [TanStack Query](https://tanstack.com/query/latest)
- [DrizzleORM](https://orm.drizzle.team/)
- [React Native MMKV](https://github.com/mrousavy/react-native-mmkv)

### UI/UX
- [React Native Paper](https://reactnativepaper.com/)
- [FlashList](https://shopify.github.io/flash-list/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

### Testing
- [Jest](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Maestro (E2E Testing)](https://maestro.mobile.dev/)

### Reference Projects
- [Bitwarden Mobile App](https://github.com/bitwarden/mobile) - Open source password manager
- [Expo Examples](https://github.com/expo/examples)

---

## 16) Quick Start

```bash
# Create new Expo project
npx create-expo-app@latest vault-protector-mobile --template tabs

# Navigate to project
cd vault-protector-mobile

# Install core dependencies
npx expo install expo-router expo-secure-store expo-local-authentication \
  expo-crypto expo-screen-capture expo-clipboard expo-haptics \
  react-native-mmkv expo-sqlite @shopify/flash-list \
  react-native-reanimated react-native-gesture-handler

# Install additional packages
npm install axios @tanstack/react-query zustand react-native-paper \
  @noble/ciphers @noble/hashes react-hook-form zod @hookform/resolvers \
  drizzle-orm date-fns uuid

# Install dev dependencies
npm install -D drizzle-kit @types/uuid eslint-plugin-security

# Start development
npx expo start
```
