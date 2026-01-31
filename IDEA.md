# Vault Protector — Ý tưởng ứng dụng quản lý mật khẩu đa nền tảng

## 1) Tầm nhìn
Một trình quản lý mật khẩu **đa nền tảng** (Web / Desktop / Mobile) theo hướng **Zero‑Knowledge + End‑to‑End Encryption (E2EE)**: server chỉ lưu dữ liệu đã mã hóa, nhà phát triển/ops không thể đọc được nội dung vault.

**Stack mục tiêu**
- Backend: Node.js + Express + TypeScript + MongoDB
- Cache/infra: Redis (rate-limit, session, queue, caching metadata)
- Web: Next.js
- Desktop: Tauri + React + TypeScript
- Mobile: Flutter

## 2) Đối tượng người dùng & use-cases
**Cá nhân**
- Lưu mật khẩu, ghi chú bảo mật, thẻ thanh toán, tài liệu
- Sinh mật khẩu mạnh, kiểm tra rò rỉ / yếu
- Autofill, copy-to-clipboard tự hủy, auto-lock

**Nhóm/Doanh nghiệp nhỏ** (giai đoạn 2)
- Chia sẻ vault theo nhóm, phân quyền, audit log
- Onboarding/offboarding, policy mật khẩu, quản lý thiết bị

## 3) Giá trị khác biệt (USP)
- **E2EE mặc định** + tùy chọn **biometric unlock** trên thiết bị
- **Offline-first**: vẫn dùng được khi mất mạng, sync khi online
- **Tối ưu trải nghiệm**: quick search, tag, templates item
- **Bảo mật thực dụng**: rate-limit, phát hiện đăng nhập bất thường, khóa phiên từ xa

## 4) Tính năng chính (MVP)
### 4.1 Vault items
- Password entry: `title`, `username`, `password`, `url`, `notes`, `tags`
- Secure note
- TOTP (2FA code) (tùy chọn MVP+)
- File attachment (MVP+)

### 4.2 Đồng bộ & quản lý phiên
- Đăng ký/đăng nhập
- Đồng bộ vault (sync)
- Danh sách thiết bị đã đăng nhập, revoke session

### 4.3 Tiện ích bảo mật
- Password generator (length, charset, pronounceable)
- Password health: yếu/trùng, thời gian đổi mật khẩu
- Clipboard timeout, auto-lock theo thời gian

## 5) Kiến trúc tổng quan
### 5.1 Sơ đồ thành phần
- **Clients**
  - Next.js Web App
  - Tauri Desktop App (React)
  - Flutter Mobile App
- **API** (Express TS)
  - Auth / Sessions
  - Vault Sync
  - Devices
  - Sharing (phase 2)
- **MongoDB**
  - Users, sessions, devices, vault blobs, audit
- **Redis**
  - Rate limiting (IP + account)
  - Session cache / token blacklist (nếu dùng JWT)
  - Queue (email/notifications) qua BullMQ

### 5.2 Nguyên tắc dữ liệu
- **Server không bao giờ nhận “master password” dưới dạng có thể dùng để giải mã vault**.
- Vault được lưu dưới dạng **encrypted blob** (ví dụ `ciphertext` + `iv` + `tag` + `version`).
- Tìm kiếm nên ưu tiên **client-side search**.

## 6) Thiết kế mã hóa (Zero‑Knowledge)
> Gợi ý thiết kế thực dụng, dễ triển khai và audit. Có thể tinh chỉnh sau.

### 6.1 Các khóa chính
- **Master Password (MP)**: người dùng nhớ
- **KDF**: Argon2id (khuyến nghị) với salt per-user
- **Master Key (MK)**: derive từ MP bằng Argon2id
- **Vault Key (VK)**: khóa thực dùng để mã hóa dữ liệu vault
  - VK có thể là random 32 bytes, được **wrap** (mã hóa) bằng MK

### 6.2 Thuật toán đề xuất
- KDF: Argon2id (memory/time cost theo thiết bị)
- Mã hóa đối xứng: AES-256-GCM hoặc XChaCha20-Poly1305
- KDF/HKDF: HKDF-SHA256 cho phân nhánh khóa theo mục đích

### 6.3 Lưu trữ phía server
- `wrappedVaultKey` (VK được mã hóa bằng MK)
- `vaultBlob` (toàn bộ vault hoặc từng item) đã mã hóa bằng VK
- Metadata nhạy cảm (title, url…) **nên** nằm trong blob mã hóa

### 6.4 Tìm kiếm trong dữ liệu mã hóa
- MVP: build index cục bộ trên client (SQLite/encrypted storage)
- Phase 2: “blind index” (HMAC từ field đã normalize) để search hạn chế, đánh đổi leak pattern

## 7) Luồng nghiệp vụ (flows)
### 7.1 Sign up
1. Client tạo `salt`, chạy Argon2id(MP, salt) -> MK
2. Client tạo VK random
3. Client wrap VK bằng MK -> `wrappedVaultKey`
4. Client tạo vault rỗng, mã hóa bằng VK -> `vaultBlob`
5. Gửi server: email, auth verifier (tách riêng), salt, wrappedVaultKey, vaultBlob

> **Lưu ý**: Auth verifier nên tách với MK để tránh dùng cùng một giá trị cho login và encryption.

### 7.2 Login
- Client lấy `salt` từ server, derive MK
- Client tải `wrappedVaultKey` và unwrap -> VK
- Client tải `vaultBlob`, decrypt -> dữ liệu

### 7.3 Sync
- Mô hình đơn giản: server lưu 1 blob + `version` + `updatedAt`
- Mô hình nâng cao: lưu theo item + `itemVersion` để merge tốt hơn

## 8) Backend API (Express + TS) — đề xuất
### 8.1 Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh` (nếu dùng refresh token)
- `POST /auth/mfa/enable|verify` (phase 2)

### 8.2 Vault
- `GET /vault` (metadata + blob)
- `PUT /vault` (upload blob mới)
- `GET /vault/sync` (delta/etag)

### 8.3 Devices & sessions
- `GET /me/sessions`
- `DELETE /me/sessions/:id`
- `GET /me/devices`

### 8.4 Health/ops
- `GET /health`
- `GET /metrics` (Prometheus, phase 2)

## 9) Mô hình dữ liệu (MongoDB) — gợi ý
### 9.1 Users
- `_id`, `email`, `emailVerified`
- `auth` (verifier hash, algo, params)
- `kdf` (argon2 params + salt)
- `wrappedVaultKey`
- `createdAt`, `updatedAt`

### 9.2 Vault
- `userId`
- `blob` (ciphertext)
- `version`, `updatedAt`
- `blobFormatVersion`

### 9.3 Sessions
- `userId`, `deviceId`
- `refreshTokenHash` (nếu dùng)
- `createdAt`, `expiresAt`, `revokedAt`

### 9.4 Devices
- `userId`, `name`, `platform`, `publicKey` (nếu dùng passkey)
- `lastSeenAt`, `createdAt`

## 10) Redis dùng cho gì?
- Rate-limit: theo IP, theo email/userId (`express-rate-limit` + store Redis)
- Session cache: mapping sessionId -> userId, TTL
- Token blacklist: revoke JWT trước hạn (nếu dùng access token dài)
- BullMQ queue:
  - Gửi email xác minh
  - Thông báo đăng nhập mới

## 11) Frontend Web (Next.js)
- Trang đăng nhập/đăng ký
- Vault list, detail, search
- Generator + security report
- Settings: auto-lock, export, sessions

**Kỹ thuật**
- Crypto: WebCrypto API (subtle crypto) hoặc thư viện audited
- Local cache: IndexedDB (Dexie) cho offline index
- Bảo mật: CSP, chống XSS, không log secrets

## 12) Desktop (Tauri + React + TS)
- Offline-first mạnh hơn Web
- Tích hợp OS:
  - Auto-start (tùy chọn)
  - Clipboard watcher + auto clear
  - Khóa bằng OS keychain / Windows Hello (phase 2)
- Local storage: SQLite + encryption (tùy chọn)

## 13) Mobile (Flutter)
- Biometric unlock: FaceID/TouchID/Android Biometrics
- Autofill:
  - iOS: Password AutoFill extension (phase 2)
  - Android: Autofill Service (phase 2)
- Local storage: `flutter_secure_storage` (nhỏ) + SQLite/isar/hive (dữ liệu lớn) kèm mã hóa

## 14) Bảo mật & hardening checklist
- TLS bắt buộc, HSTS
- Hash mật khẩu đăng nhập: Argon2id (hoặc scrypt/bcrypt) + pepper server-side
- Rate limiting + lockout theo hành vi
- Audit log (không chứa secrets)
- Bảo vệ chống CSRF (nếu cookie auth), chống XSS, CORS chặt
- Secrets quản lý qua env + vault (1Password/KeyVault) (phase 2)
- Backup MongoDB + rotation key (phase 2)

## 15) Export/Import & Recovery
- Export định dạng:
  - Encrypted JSON (khuyến nghị)
  - CSV (nguy hiểm, cảnh báo rõ)
- Khôi phục tài khoản: recovery code + email verify
- Emergency access (phase 2)

## 16) Roadmap triển khai
### Milestone 0 — Foundation
- Monorepo structure, CI, lint, format
- API skeleton + Mongo models

### Milestone 1 — MVP (Web + API)
- Register/login
- Vault blob CRUD + versioning
- Client-side encryption/decryption
- Basic search (client)

### Milestone 2 — Desktop
- Tauri app parity với web
- Offline-first + clipboard timeout + auto-lock

### Milestone 3 — Mobile
- Flutter app parity
- Biometric unlock

### Milestone 4 — Team/Sharing
- Shared vault, roles
- Audit logs, policies

## 17) Gợi ý cấu trúc repo (monorepo)
- `apps/api` (Express TS)
- `apps/web` (Next.js)
- `apps/desktop` (Tauri + React)
- `apps/mobile` (Flutter)
- `packages/crypto` (logic E2EE dùng chung, audit kỹ)
- `packages/shared` (types, zod schemas)
- `infra/` (docker-compose cho mongodb/redis)

## 18) Rủi ro & quyết định sớm
- **Crypto design**: cần “đóng băng” format + versioning sớm để tránh migrate đau đớn
- **Search**: client-side index là lựa chọn MVP an toàn
- **Sync conflicts**: blob toàn cục dễ làm, item-level sync tốt hơn nhưng phức tạp
- **Autofill**: mobile/desktop sẽ tốn thời gian tích hợp, nên để phase 2 nếu cần ra MVP nhanh

---
Nếu bạn muốn, mình có thể tiếp tục scaffold monorepo (Express/Next/Tauri/Flutter) theo cấu trúc ở mục 17 + docker-compose cho MongoDB/Redis.
