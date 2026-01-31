# TODO - Vault Protector Mobile App

## Tổng quan
Tài liệu này mô tả phương án triển khai các tính năng còn lại của ứng dụng Vault Protector.

---

## 1. Bật/Tắt Tự Động Đồng Bộ

### Mô tả
Cho phép người dùng bật/tắt tính năng tự động đồng bộ vault với server.

### Backend
- [ ] Không cần thay đổi backend (cấu hình client-side)

### Mobile

#### 1.1 Storage
- [ ] Thêm key `SYNC_AUTO_ENABLED` vào `secureStorage.ts`
- [ ] Lưu trạng thái bật/tắt vào AsyncStorage (không cần bảo mật)

#### 1.2 Store
- [ ] Tạo `syncStore.ts` hoặc thêm vào `settingsStore.ts`:
  ```typescript
  interface SyncSettings {
    autoSyncEnabled: boolean;
    syncInterval: number; // milliseconds
    lastSyncAt: Date | null;
    syncOnAppOpen: boolean;
    syncOnWifi: boolean; // chỉ đồng bộ khi có WiFi
  }
  ```

#### 1.3 Hook
- [ ] Tạo `useSyncSettings.ts`:
  - `toggleAutoSync()` - bật/tắt
  - `setSyncInterval(interval)` - đặt khoảng thời gian
  - `setSyncOnWifi(enabled)` - chỉ sync qua WiFi

#### 1.4 Background Sync
- [ ] Sử dụng `expo-background-fetch` để đồng bộ nền:
  ```typescript
  import * as BackgroundFetch from 'expo-background-fetch';
  import * as TaskManager from 'expo-task-manager';
  
  const BACKGROUND_SYNC_TASK = 'vault-background-sync';
  
  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    // Sync logic here
    return BackgroundFetch.BackgroundFetchResult.NewData;
  });
  ```

#### 1.5 UI (Settings Screen)
- [ ] Thêm toggle "Tự động đồng bộ" trong màn hình Cài đặt
- [ ] Thêm dropdown chọn khoảng thời gian (5 phút, 15 phút, 30 phút, 1 giờ)
- [ ] Thêm toggle "Chỉ đồng bộ qua WiFi"

### Files cần tạo/sửa
```
mobile/src/stores/syncStore.ts          (tạo mới)
mobile/src/hooks/useSyncSettings.ts     (tạo mới)
mobile/src/services/sync/background.ts  (tạo mới)
mobile/app/(tabs)/settings.tsx          (sửa - thêm UI)
```

---

## 2. Đồng Bộ Ngay

### Mô tả
Nút để người dùng chủ động đồng bộ vault với server ngay lập tức.

### Backend
- [ ] API `GET /vault` - đã có
- [ ] API `PUT /vault` - đã có
- [ ] API `GET /vault/sync-status` - kiểm tra phiên bản mới nhất (optional)

### Mobile

#### 2.1 Hook Enhancement
- [ ] Cập nhật `useVault.ts`:
  ```typescript
  interface UseVaultReturn {
    // existing...
    sync: () => Promise<void>;
    isSyncing: boolean;
    lastSyncAt: Date | null;
    syncError: Error | null;
  }
  ```

#### 2.2 Sync Logic
- [ ] Implement conflict resolution:
  1. So sánh `version` local vs server
  2. Nếu server mới hơn → pull
  3. Nếu local mới hơn → push
  4. Nếu cả hai đều thay đổi → merge hoặc hỏi người dùng

#### 2.3 UI
- [ ] Thêm nút "Đồng bộ ngay" trong Settings:
  ```tsx
  <List.Item
    title={t('settings.syncNow')}
    description={lastSyncAt ? `Lần cuối: ${formatDate(lastSyncAt)}` : 'Chưa đồng bộ'}
    left={props => <List.Icon {...props} icon="sync" />}
    right={() => isSyncing ? <ActivityIndicator /> : null}
    onPress={handleSync}
  />
  ```
- [ ] Pull-to-refresh trên màn hình Vault để đồng bộ

#### 2.4 Offline Support
- [ ] Sử dụng `@react-native-community/netinfo` để kiểm tra kết nối
- [ ] Queue các thay đổi khi offline
- [ ] Tự động sync khi có mạng lại

### Files cần tạo/sửa
```
mobile/src/hooks/useVault.ts              (sửa - thêm sync logic)
mobile/src/services/sync/syncService.ts   (tạo mới)
mobile/src/services/sync/conflictResolver.ts (tạo mới)
mobile/app/(tabs)/settings.tsx            (sửa - thêm UI)
mobile/app/(tabs)/vault.tsx               (sửa - pull-to-refresh)
```

---

## 3. Quản Lý Thiết Bị

### Mô tả
Xem danh sách thiết bị đã đăng nhập và có thể xóa/thu hồi quyền truy cập.

### Backend

#### 3.1 APIs (đã có sẵn trong modules/devices)
- [x] `GET /devices` - Lấy danh sách thiết bị
- [x] `DELETE /devices/:id` - Xóa thiết bị
- [x] `PUT /devices/:id/trust` - Đánh dấu tin cậy
- [x] `PUT /devices/:id/revoke` - Thu hồi quyền

#### 3.2 Response format
```typescript
interface Device {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'web';
  lastActiveAt: Date;
  lastIpAddress: string;
  isTrusted: boolean;
  isCurrent: boolean; // Thiết bị đang dùng
  createdAt: Date;
}
```

### Mobile

#### 4.1 API Client
- [ ] Thêm vào `api/endpoints.ts`:
  ```typescript
  export const DEVICE_ENDPOINTS = {
    LIST: '/devices',
    DELETE: (id: string) => `/devices/${id}`,
    TRUST: (id: string) => `/devices/${id}/trust`,
    REVOKE: (id: string) => `/devices/${id}/revoke`,
  };
  ```

#### 4.2 Hook
- [ ] Tạo `useDevices.ts`:
  ```typescript
  export function useDevices() {
    return {
      devices: Device[];
      isLoading: boolean;
      currentDevice: Device | null;
      removeDevice: (id: string) => Promise<void>;
      trustDevice: (id: string) => Promise<void>;
      revokeDevice: (id: string) => Promise<void>;
      refetch: () => void;
    };
  }
  ```

#### 4.3 UI - Màn hình Quản lý thiết bị
- [ ] Tạo `app/settings/devices.tsx`:
  - Danh sách thiết bị với icon platform
  - Badge "Thiết bị này" cho current device
  - Badge "Tin cậy" cho trusted devices
  - Menu actions: Trust/Revoke, Remove
  - Thời gian hoạt động cuối
  - Địa chỉ IP

```tsx
<List.Item
  title={device.name}
  description={`${device.platform} • ${formatRelativeTime(device.lastActiveAt)}`}
  left={() => <Icon name={device.platform === 'ios' ? 'apple' : 'android'} />}
  right={() => (
    <>
      {device.isCurrent && <Chip>Thiết bị này</Chip>}
      {device.isTrusted && <Chip icon="shield-check">Tin cậy</Chip>}
      <IconButton icon="dots-vertical" onPress={() => showMenu(device)} />
    </>
  )}
/>
```

### Files cần tạo/sửa
```
mobile/src/services/api/endpoints.ts      (sửa - thêm DEVICE_ENDPOINTS)
mobile/src/hooks/useDevices.ts            (tạo mới)
mobile/src/types/device.types.ts          (tạo mới)
mobile/app/settings/devices.tsx           (tạo mới)
mobile/app/settings/_layout.tsx           (tạo mới nếu chưa có)
mobile/app/(tabs)/settings.tsx            (sửa - thêm link)
```

---

## 4. Phiên Hoạt Động (Sessions)

### Mô tả
Xem và quản lý các phiên đăng nhập đang hoạt động.

### Backend

#### 4.1 APIs (đã có sẵn trong modules/sessions)
- [x] `GET /sessions` - Lấy danh sách phiên
- [x] `DELETE /sessions/:id` - Đăng xuất phiên cụ thể
- [x] `DELETE /sessions/all` - Đăng xuất tất cả (trừ phiên hiện tại)

#### 4.2 Response format
```typescript
interface Session {
  id: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  ipAddress: string;
  userAgent: string;
  location?: string; // Geo-IP lookup
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}
```

### Mobile

#### 4.1 API Client
- [ ] Thêm vào `api/endpoints.ts`:
  ```typescript
  export const SESSION_ENDPOINTS = {
    LIST: '/sessions',
    REVOKE: (id: string) => `/sessions/${id}`,
    REVOKE_ALL: '/sessions/all',
  };
  ```

#### 4.2 Hook
- [ ] Tạo `useSessions.ts`:
  ```typescript
  export function useSessions() {
    return {
      sessions: Session[];
      isLoading: boolean;
      currentSession: Session | null;
      revokeSession: (id: string) => Promise<void>;
      revokeAllOtherSessions: () => Promise<void>;
      refetch: () => void;
    };
  }
  ```

#### 4.3 UI - Màn hình Phiên hoạt động
- [ ] Tạo `app/settings/sessions.tsx`:
  - Danh sách phiên với thông tin chi tiết
  - Badge "Phiên hiện tại"
  - Nút "Đăng xuất" cho từng phiên
  - Nút "Đăng xuất tất cả thiết bị khác"
  - Thông tin: IP, Location, Thời gian tạo, Hoạt động cuối

```tsx
<Card>
  <Card.Title
    title={session.deviceName}
    subtitle={`${session.platform} • ${session.location || session.ipAddress}`}
    left={() => <Avatar.Icon icon="cellphone" />}
    right={() => session.isCurrent ? <Chip mode="outlined">Phiên này</Chip> : null}
  />
  <Card.Content>
    <Text variant="bodySmall">Đăng nhập: {formatDate(session.createdAt)}</Text>
    <Text variant="bodySmall">Hoạt động: {formatRelativeTime(session.lastActiveAt)}</Text>
  </Card.Content>
  {!session.isCurrent && (
    <Card.Actions>
      <Button onPress={() => handleRevoke(session.id)}>Đăng xuất</Button>
    </Card.Actions>
  )}
</Card>
```

### Files cần tạo/sửa
```
mobile/src/services/api/endpoints.ts      (sửa - thêm SESSION_ENDPOINTS)
mobile/src/hooks/useSessions.ts           (tạo mới)
mobile/src/types/session.types.ts         (tạo mới)
mobile/app/settings/sessions.tsx          (tạo mới)
mobile/app/(tabs)/settings.tsx            (sửa - thêm link)
```

---

## 5. Phiên Bản và Tự Động Cập Nhật

### Mô tả
Hiển thị phiên bản app và hỗ trợ tự động cập nhật (OTA với expo-updates).

### Backend

#### 5.1 API mới
- [ ] `GET /app/version` - Lấy thông tin phiên bản mới nhất:
  ```typescript
  interface VersionInfo {
    currentVersion: string;
    latestVersion: string;
    minRequiredVersion: string;
    updateUrl?: string;
    releaseNotes?: string;
    isForceUpdate: boolean;
  }
  ```

### Mobile

#### 5.1 Expo Updates Setup
- [ ] Cấu hình `app.json`:
  ```json
  {
    "expo": {
      "updates": {
        "enabled": true,
        "checkAutomatically": "ON_LOAD",
        "fallbackToCacheTimeout": 0
      },
      "runtimeVersion": {
        "policy": "sdkVersion"
      }
    }
  }
  ```

#### 5.2 Hook
- [ ] Tạo `useAppUpdate.ts`:
  ```typescript
  import * as Updates from 'expo-updates';
  
  export function useAppUpdate() {
    const [updateInfo, setUpdateInfo] = useState<{
      isUpdateAvailable: boolean;
      isUpdatePending: boolean;
      manifest: Updates.Manifest | null;
    }>();
    
    const checkForUpdate = async () => {
      const update = await Updates.checkForUpdateAsync();
      return update.isAvailable;
    };
    
    const downloadUpdate = async () => {
      await Updates.fetchUpdateAsync();
    };
    
    const applyUpdate = async () => {
      await Updates.reloadAsync();
    };
    
    return {
      currentVersion: Application.nativeApplicationVersion,
      buildNumber: Application.nativeBuildVersion,
      ...updateInfo,
      checkForUpdate,
      downloadUpdate,
      applyUpdate,
    };
  }
  ```

#### 5.3 Auto-check on App Start
- [ ] Trong `_layout.tsx` hoặc App entry:
  ```typescript
  useEffect(() => {
    async function checkUpdate() {
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Show dialog to user
          Alert.alert(
            'Cập nhật mới',
            'Đã có phiên bản mới. Khởi động lại để cập nhật?',
            [
              { text: 'Sau', style: 'cancel' },
              { text: 'Cập nhật', onPress: () => Updates.reloadAsync() }
            ]
          );
        }
      }
    }
    checkUpdate();
  }, []);
  ```

#### 5.4 UI - Màn hình About/Version
- [ ] Tạo hoặc cập nhật `app/settings/about.tsx`:
  - Hiển thị logo app
  - Phiên bản hiện tại
  - Nút "Kiểm tra cập nhật"
  - Trạng thái cập nhật (đang tải, sẵn sàng, mới nhất)
  - Release notes nếu có
  - Links: Privacy Policy, Terms of Service, Licenses

```tsx
<View style={styles.versionSection}>
  <Text variant="titleMedium">Phiên bản {currentVersion}</Text>
  <Text variant="bodySmall">Build {buildNumber}</Text>
  
  {isUpdateAvailable ? (
    <Button mode="contained" onPress={handleUpdate} loading={isDownloading}>
      {isUpdatePending ? 'Khởi động lại để cập nhật' : 'Tải cập nhật'}
    </Button>
  ) : (
    <Button mode="outlined" onPress={checkForUpdate} loading={isChecking}>
      Kiểm tra cập nhật
    </Button>
  )}
  
  {isLatest && <Text style={styles.upToDate}>✓ Bạn đang dùng phiên bản mới nhất</Text>}
</View>
```

#### 5.5 Force Update Modal
- [ ] Tạo component `ForceUpdateModal.tsx`:
  - Modal không thể dismiss
  - Thông báo cập nhật bắt buộc
  - Nút cập nhật (redirect to store hoặc OTA)

### Files cần tạo/sửa
```
backend/src/modules/app/app.routes.ts     (tạo mới - version API)
backend/src/modules/app/app.service.ts    (tạo mới)
mobile/src/hooks/useAppUpdate.ts          (tạo mới)
mobile/src/components/ForceUpdateModal.tsx (tạo mới)
mobile/app/settings/about.tsx             (tạo mới)
mobile/app/_layout.tsx                    (sửa - auto-check update)
mobile/app.json                           (sửa - expo-updates config)
```

---

## Thứ Tự Triển Khai Đề Xuất

### Phase 1 - Sync (Ưu tiên cao)
1. ✅ Đồng bộ ngay (core feature)
2. ✅ Bật/tắt tự động đồng bộ

### Phase 2 - Security (Ưu tiên cao)
3. ✅ Quản lý thiết bị
4. ✅ Phiên hoạt động

### Phase 3 - Maintenance (Ưu tiên trung bình)
5. ✅ Phiên bản và tự động cập nhật

---

## Dependencies Cần Cài Đặt

```bash
# Mobile
npx expo install expo-background-fetch
npx expo install expo-task-manager
npx expo install expo-updates
npx expo install @react-native-community/netinfo
```

---

## Notes

- Tất cả API endpoints cho devices và sessions đã được implement ở backend
- Cần test kỹ background sync trên cả iOS và Android
- Force update nên có fallback redirect đến App Store/Play Store nếu OTA fail
- Cân nhắc thêm biometric re-authentication khi revoke sessions
