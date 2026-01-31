# Vault Protector — Backend Documentation

> **Stack**: Node.js + Express + TypeScript + MongoDB + Redis

---

## 1. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
│   (Next.js Web / Tauri Desktop / Flutter Mobile)                │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX / Load Balancer                      │
│                 (TLS termination, rate-limit L7)                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS API SERVER                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────┐  │
│  │   Auth    │  │   Vault   │  │  Devices  │  │   Sharing    │  │
│  │  Module   │  │  Module   │  │  Module   │  │   (phase 2)  │  │
│  └───────────┘  └───────────┘  └───────────┘  └──────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Middleware Layer                               ││
│  │  (Auth, RateLimit, Validation, ErrorHandler, Logging)       ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   MongoDB   │  │    Redis    │  │  BullMQ     │
    │  (Primary)  │  │   (Cache)   │  │  (Queue)    │
    └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 2. Cấu trúc thư mục đề xuất

```
backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express app setup
│   ├── config/
│   │   ├── index.ts             # Config aggregator
│   │   ├── env.ts               # Environment variables validation (zod)
│   │   ├── database.ts          # MongoDB connection config
│   │   └── redis.ts             # Redis connection config
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.dto.ts       # Request/Response DTOs (zod)
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── vault/
│   │   │   ├── vault.controller.ts
│   │   │   ├── vault.service.ts
│   │   │   ├── vault.routes.ts
│   │   │   ├── vault.dto.ts
│   │   │   └── vault.types.ts
│   │   │
│   │   ├── devices/
│   │   │   ├── devices.controller.ts
│   │   │   ├── devices.service.ts
│   │   │   ├── devices.routes.ts
│   │   │   └── devices.dto.ts
│   │   │
│   │   ├── sessions/
│   │   │   ├── sessions.controller.ts
│   │   │   ├── sessions.service.ts
│   │   │   ├── sessions.routes.ts
│   │   │   └── sessions.dto.ts
│   │   │
│   │   └── users/
│   │       ├── users.controller.ts
│   │       ├── users.service.ts
│   │       ├── users.routes.ts
│   │       └── users.dto.ts
│   │
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── vault.model.ts
│   │   ├── session.model.ts
│   │   ├── device.model.ts
│   │   └── audit-log.model.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts        # JWT/session verification
│   │   ├── rate-limit.middleware.ts  # Redis-backed rate limiting
│   │   ├── validate.middleware.ts    # Zod validation
│   │   ├── error.middleware.ts       # Global error handler
│   │   └── logger.middleware.ts      # Request logging
│   │
│   ├── lib/
│   │   ├── crypto.ts            # Server-side crypto utilities
│   │   ├── jwt.ts               # JWT helpers
│   │   ├── password.ts          # Argon2 hashing
│   │   ├── redis.ts             # Redis client singleton
│   │   └── mongo.ts             # MongoDB client singleton
│   │
│   ├── jobs/
│   │   ├── queue.ts             # BullMQ setup
│   │   ├── email.job.ts         # Email sending worker
│   │   └── cleanup.job.ts       # Session/token cleanup
│   │
│   ├── utils/
│   │   ├── api-error.ts         # Custom error classes
│   │   ├── api-response.ts      # Response helpers
│   │   ├── constants.ts
│   │   └── helpers.ts
│   │
│   └── types/
│       ├── express.d.ts         # Express augmentation
│       └── global.d.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── scripts/
│   ├── seed.ts                  # Seed database
│   └── migrate.ts               # Migration runner
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 3. Models (MongoDB Schemas)

### 3.1 User Model

```typescript
// src/models/user.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;

  // Authentication (server-side verifier, NOT the master key)
  auth: {
    verifierHash: string;      // Argon2 hash of auth verifier
    algorithm: string;         // 'argon2id'
    version: number;           // Protocol version
  };

  // KDF parameters (shared with client)
  kdf: {
    algorithm: string;         // 'argon2id'
    salt: string;              // Base64 encoded, unique per user
    memory: number;            // Memory cost in KB (e.g., 65536)
    iterations: number;        // Time cost (e.g., 3)
    parallelism: number;       // Parallelism factor (e.g., 4)
  };

  // Encrypted vault key (client encrypts VK with MK)
  wrappedVaultKey: string;     // Base64 encoded

  // Account status
  status: 'active' | 'locked' | 'suspended';
  failedLoginAttempts: number;
  lockoutUntil?: Date;

  // Recovery
  recoveryKeyHash?: string;    // Hashed recovery key
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    auth: {
      verifierHash: { type: String, required: true },
      algorithm: { type: String, default: 'argon2id' },
      version: { type: Number, default: 1 },
    },

    kdf: {
      algorithm: { type: String, default: 'argon2id' },
      salt: { type: String, required: true },
      memory: { type: Number, default: 65536 },
      iterations: { type: Number, default: 3 },
      parallelism: { type: Number, default: 4 },
    },

    wrappedVaultKey: { type: String, required: true },

    status: {
      type: String,
      enum: ['active', 'locked', 'suspended'],
      default: 'active',
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: Date,

    recoveryKeyHash: String,

    lastLoginAt: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'emailVerificationToken': 1 }, { sparse: true });

export const User = model<IUser>('User', userSchema);
```

### 3.2 Vault Model

```typescript
// src/models/vault.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IVault extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  
  // Encrypted vault data
  blob: string;                 // Base64 encoded ciphertext
  
  // Encryption metadata (public, không nhạy cảm)
  encryption: {
    algorithm: string;          // 'aes-256-gcm' | 'xchacha20-poly1305'
    iv: string;                 // Base64 encoded IV/nonce
    tag: string;                // Base64 encoded auth tag (GCM)
  };

  // Versioning for conflict resolution
  version: number;              // Incremental version
  checksum: string;             // SHA-256 of plaintext (client-computed)
  
  // Format versioning for migrations
  blobFormatVersion: number;    // Schema version of decrypted data
  
  // Sync metadata
  lastSyncedAt: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const vaultSchema = new Schema<IVault>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    blob: { type: String, required: true },

    encryption: {
      algorithm: { type: String, required: true },
      iv: { type: String, required: true },
      tag: { type: String, required: true },
    },

    version: { type: Number, default: 1 },
    checksum: { type: String, required: true },
    blobFormatVersion: { type: Number, default: 1 },

    lastSyncedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'vaults',
  }
);

// Compound index for efficient queries
vaultSchema.index({ userId: 1, version: -1 });

export const Vault = model<IVault>('Vault', vaultSchema);
```

### 3.3 Session Model

```typescript
// src/models/session.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  deviceId: Types.ObjectId;

  // Token management
  refreshTokenHash: string;     // Hashed refresh token
  accessTokenFamily: string;    // Token family for rotation detection

  // Session metadata
  ipAddress: string;
  userAgent: string;
  
  // Lifecycle
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  revokedAt?: Date;
  revokedReason?: string;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },

    refreshTokenHash: { type: String, required: true },
    accessTokenFamily: { type: String, required: true, index: true },

    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },

    expiresAt: { type: Date, required: true, index: true },
    lastActivityAt: { type: Date, default: Date.now },
    revokedAt: Date,
    revokedReason: String,
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

// TTL index for automatic cleanup
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1, revokedAt: 1 });

export const Session = model<ISession>('Session', sessionSchema);
```

### 3.4 Device Model

```typescript
// src/models/device.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export type DevicePlatform = 'web' | 'desktop-windows' | 'desktop-macos' | 'desktop-linux' | 'ios' | 'android';

export interface IDevice extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  // Device identification
  name: string;                  // User-friendly name
  platform: DevicePlatform;
  deviceIdentifier: string;      // Unique device fingerprint (hashed)

  // Security
  publicKey?: string;            // For device-specific encryption (optional)
  trusted: boolean;              // User has marked as trusted
  
  // Activity tracking
  lastSeenAt: Date;
  lastIpAddress: string;
  
  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: { type: String, required: true },
    platform: {
      type: String,
      enum: ['web', 'desktop-windows', 'desktop-macos', 'desktop-linux', 'ios', 'android'],
      required: true,
    },
    deviceIdentifier: { type: String, required: true },

    publicKey: String,
    trusted: { type: Boolean, default: false },

    lastSeenAt: { type: Date, default: Date.now },
    lastIpAddress: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'devices',
  }
);

deviceSchema.index({ userId: 1, deviceIdentifier: 1 }, { unique: true });

export const Device = model<IDevice>('Device', deviceSchema);
```

### 3.5 Audit Log Model

```typescript
// src/models/audit-log.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export type AuditAction =
  | 'user.register'
  | 'user.login'
  | 'user.login.failed'
  | 'user.logout'
  | 'user.password.change'
  | 'user.email.verify'
  | 'vault.sync'
  | 'vault.update'
  | 'session.create'
  | 'session.revoke'
  | 'device.add'
  | 'device.remove'
  | 'device.trust';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;       // Optional for failed login attempts
  
  action: AuditAction;
  status: 'success' | 'failure';
  
  // Context (không chứa secrets)
  metadata: {
    ipAddress: string;
    userAgent: string;
    deviceId?: string;
    sessionId?: string;
    reason?: string;             // Failure reason
    [key: string]: unknown;
  };

  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    action: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  }
);

// Indexes for common queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days TTL

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
```

---

## 4. API Endpoints chi tiết

### 4.1 Authentication Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới | ❌ |
| `POST` | `/api/v1/auth/login` | Đăng nhập | ❌ |
| `POST` | `/api/v1/auth/logout` | Đăng xuất | ✅ |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | 🔄 |
| `GET`  | `/api/v1/auth/prelogin` | Lấy KDF params trước login | ❌ |
| `POST` | `/api/v1/auth/verify-email` | Xác thực email | ❌ |
| `POST` | `/api/v1/auth/resend-verification` | Gửi lại email xác thực | ❌ |
| `POST` | `/api/v1/auth/forgot-password` | Yêu cầu reset password | ❌ |
| `POST` | `/api/v1/auth/reset-password` | Reset password với token | ❌ |
| `POST` | `/api/v1/auth/change-password` | Đổi password (đã login) | ✅ |

#### 4.1.1 `POST /api/v1/auth/register`

**Request:**
```typescript
interface RegisterRequest {
  email: string;
  
  // Client-computed auth verifier (NOT master key)
  authVerifier: string;         // Base64
  
  // KDF parameters client đã dùng
  kdf: {
    algorithm: 'argon2id';
    salt: string;               // Base64, client-generated
    memory: number;
    iterations: number;
    parallelism: number;
  };
  
  // Vault key wrapped by master key
  wrappedVaultKey: string;      // Base64
  
  // Initial empty vault (encrypted)
  initialVault: {
    blob: string;               // Base64 ciphertext
    encryption: {
      algorithm: string;
      iv: string;
      tag: string;
    };
    checksum: string;           // SHA-256 of plaintext
  };
  
  // Device info
  device: {
    name: string;
    platform: DevicePlatform;
    deviceIdentifier: string;
  };
}
```

**Response (201):**
```typescript
interface RegisterResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    device: {
      id: string;
      name: string;
    };
  };
}
```

#### 4.1.2 `GET /api/v1/auth/prelogin?email=...`

Trả về KDF params để client derive master key trước khi login.

**Response (200):**
```typescript
interface PreloginResponse {
  success: true;
  data: {
    kdf: {
      algorithm: 'argon2id';
      salt: string;
      memory: number;
      iterations: number;
      parallelism: number;
    };
  };
}
```

**Response (404):** Email không tồn tại (cân nhắc timing attack)

#### 4.1.3 `POST /api/v1/auth/login`

**Request:**
```typescript
interface LoginRequest {
  email: string;
  authVerifier: string;         // Client derives từ master password
  
  device: {
    name: string;
    platform: DevicePlatform;
    deviceIdentifier: string;
  };
}
```

**Response (200):**
```typescript
interface LoginResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    wrappedVaultKey: string;    // Client cần để unwrap vault key
    device: {
      id: string;
      name: string;
      isNew: boolean;           // True nếu device mới
    };
  };
}
```

#### 4.1.4 `POST /api/v1/auth/change-password`

**Request:**
```typescript
interface ChangePasswordRequest {
  currentAuthVerifier: string;  // Verify current password
  newAuthVerifier: string;      // New auth verifier
  newWrappedVaultKey: string;   // Re-wrapped với new master key
  
  // Optional: update KDF params
  newKdf?: {
    algorithm: 'argon2id';
    salt: string;
    memory: number;
    iterations: number;
    parallelism: number;
  };
}
```

---

### 4.2 Vault Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`  | `/api/v1/vault` | Lấy vault hiện tại | ✅ |
| `PUT`  | `/api/v1/vault` | Cập nhật vault | ✅ |
| `GET`  | `/api/v1/vault/sync` | Check sync status | ✅ |
| `GET`  | `/api/v1/vault/history` | Lịch sử versions | ✅ |

#### 4.2.1 `GET /api/v1/vault`

**Query params:**
- `version` (optional): Chỉ trả về nếu server version > client version

**Response (200):**
```typescript
interface GetVaultResponse {
  success: true;
  data: {
    vault: {
      blob: string;
      encryption: {
        algorithm: string;
        iv: string;
        tag: string;
      };
      version: number;
      checksum: string;
      blobFormatVersion: number;
      lastSyncedAt: string;     // ISO date
    };
  };
}
```

**Response (304):** Not Modified (client đã có version mới nhất)

#### 4.2.2 `PUT /api/v1/vault`

**Request:**
```typescript
interface UpdateVaultRequest {
  blob: string;
  encryption: {
    algorithm: string;
    iv: string;
    tag: string;
  };
  expectedVersion: number;      // Optimistic locking
  checksum: string;
  blobFormatVersion: number;
}
```

**Response (200):**
```typescript
interface UpdateVaultResponse {
  success: true;
  data: {
    version: number;            // New version
    lastSyncedAt: string;
  };
}
```

**Response (409):** Conflict - version mismatch

#### 4.2.3 `GET /api/v1/vault/sync`

Quick check xem có cần sync không.

**Response (200):**
```typescript
interface SyncStatusResponse {
  success: true;
  data: {
    currentVersion: number;
    lastSyncedAt: string;
    checksum: string;
  };
}
```

---

### 4.3 Sessions Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`  | `/api/v1/sessions` | Danh sách sessions | ✅ |
| `DELETE` | `/api/v1/sessions/:id` | Revoke session | ✅ |
| `DELETE` | `/api/v1/sessions` | Revoke all (trừ current) | ✅ |

#### 4.3.1 `GET /api/v1/sessions`

**Response (200):**
```typescript
interface GetSessionsResponse {
  success: true;
  data: {
    sessions: Array<{
      id: string;
      device: {
        id: string;
        name: string;
        platform: DevicePlatform;
      };
      ipAddress: string;
      userAgent: string;
      createdAt: string;
      lastActivityAt: string;
      isCurrent: boolean;
    }>;
  };
}
```

---

### 4.4 Devices Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`  | `/api/v1/devices` | Danh sách devices | ✅ |
| `PATCH` | `/api/v1/devices/:id` | Update device info | ✅ |
| `DELETE` | `/api/v1/devices/:id` | Xóa device | ✅ |
| `POST` | `/api/v1/devices/:id/trust` | Đánh dấu trusted | ✅ |

---

### 4.5 Users Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`  | `/api/v1/users/me` | Thông tin user hiện tại | ✅ |
| `PATCH` | `/api/v1/users/me` | Cập nhật profile | ✅ |
| `DELETE` | `/api/v1/users/me` | Xóa tài khoản | ✅ |
| `GET`  | `/api/v1/users/me/audit-logs` | Lịch sử hoạt động | ✅ |

---

## 5. Middleware chi tiết

### 5.1 Authentication Middleware

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis';
import { ApiError } from '../utils/api-error';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    sessionId: string;
    deviceId: string;
  };
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing authentication token');
    }
    
    const token = authHeader.slice(7);
    
    // 2. Verify JWT
    const payload = jwt.verify(token, config.jwt.accessSecret) as {
      sub: string;
      email: string;
      sid: string;
      did: string;
      iat: number;
      exp: number;
    };
    
    // 3. Check blacklist (for revoked tokens)
    const isBlacklisted = await redis.get(`blacklist:${payload.sid}`);
    if (isBlacklisted) {
      throw new ApiError(401, 'Token has been revoked');
    }
    
    // 4. Attach user to request
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      sessionId: payload.sid,
      deviceId: payload.did,
    };
    
    // 5. Update session activity (async, non-blocking)
    redis.set(
      `session:activity:${payload.sid}`,
      Date.now().toString(),
      'EX',
      86400
    ).catch(() => {}); // Ignore errors
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  
  return authenticate(req, res, next);
};
```

### 5.2 Rate Limiting Middleware

```typescript
// src/middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis';
import { ApiError } from '../utils/api-error';

// General API rate limit
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 100,                      // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new ApiError(429, 'Too many requests, please try again later');
  },
});

// Strict limit for auth endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 10,                       // 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Combine IP + email for more granular limiting
    const email = req.body?.email || 'unknown';
    return `${req.ip}:${email}`;
  },
  handler: (req, res) => {
    throw new ApiError(429, 'Too many login attempts, please try again later');
  },
});

// Very strict limit for password reset
export const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:reset:',
  }),
  windowMs: 60 * 60 * 1000,     // 1 hour
  max: 3,                        // 3 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 5.3 Validation Middleware

```typescript
// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/api-error';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      const parsed = schema.parse(data);
      req[target] = parsed; // Replace with parsed (and transformed) data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (e) => `${e.path.join('.')}: ${e.message}`
        );
        next(new ApiError(400, 'Validation failed', messages));
      } else {
        next(error);
      }
    }
  };
};
```

### 5.4 Error Handler Middleware

```typescript
// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { logger } from '../lib/logger';
import { config } from '../config';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle known errors
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        details: error.details,
      },
    });
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: error.message,
      },
    });
  }

  // Handle MongoDB duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        message: 'Resource already exists',
      },
    });
  }

  // Default: Internal server error
  return res.status(500).json({
    success: false,
    error: {
      message: config.isProduction
        ? 'Internal server error'
        : error.message,
    },
  });
};
```

---

## 6. Redis Usage Patterns

### 6.1 Connection Setup

```typescript
// src/lib/redis.ts
import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected');
});
```

### 6.2 Use Cases

| Use Case | Key Pattern | TTL | Description |
|----------|-------------|-----|-------------|
| Rate Limiting | `rl:{type}:{identifier}` | 15m-1h | IP + email based |
| Session Cache | `session:{sessionId}` | 7d | Quick session lookup |
| Token Blacklist | `blacklist:{sessionId}` | Token TTL | Revoked access tokens |
| Activity Tracking | `session:activity:{sessionId}` | 24h | Last activity timestamp |
| Email Verification | `email:verify:{token}` | 24h | Pending verifications |
| Password Reset | `pwd:reset:{token}` | 1h | Password reset tokens |
| Login Attempts | `login:attempts:{email}` | 15m | Failed login counter |
| Prelogin Cache | `prelogin:{email}` | 5m | KDF params cache |

### 6.3 BullMQ Queues

```typescript
// src/jobs/queue.ts
import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis';

// Email queue
export const emailQueue = new Queue('email', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

// Notification queue
export const notificationQueue = new Queue('notification', {
  connection: redis,
});

// Cleanup queue (scheduled jobs)
export const cleanupQueue = new Queue('cleanup', {
  connection: redis,
});
```

---

## 7. Security Considerations

### 7.1 Authentication Flow

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│  Client │                    │   API   │                    │   DB    │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                              │                              │
     │ 1. GET /prelogin?email=...   │                              │
     │ ─────────────────────────────>                              │
     │                              │  2. Lookup user KDF params   │
     │                              │ ─────────────────────────────>
     │                              │ <─────────────────────────────
     │ <─────────────────────────────                              │
     │    { kdf: { salt, memory,    │                              │
     │      iterations, ... } }     │                              │
     │                              │                              │
     │ 3. User enters password      │                              │
     │    Client: MK = Argon2(      │                              │
     │      password, salt, params) │                              │
     │    Client: authVerifier =    │                              │
     │      HKDF(MK, "auth")        │                              │
     │                              │                              │
     │ 4. POST /login               │                              │
     │    { email, authVerifier,    │                              │
     │      device }                │                              │
     │ ─────────────────────────────>                              │
     │                              │  5. Verify authVerifier      │
     │                              │     (Argon2 verify)          │
     │                              │ ─────────────────────────────>
     │                              │ <─────────────────────────────
     │                              │                              │
     │                              │  6. Create session, device   │
     │                              │ ─────────────────────────────>
     │ <─────────────────────────────                              │
     │    { tokens, wrappedVaultKey │                              │
     │      device }                │                              │
     │                              │                              │
     │ 7. Client: VK = decrypt(     │                              │
     │      wrappedVaultKey, MK)    │                              │
     │    Client stores VK in       │                              │
     │    secure memory             │                              │
     │                              │                              │
```

### 7.2 Checklist bảo mật Backend

- [ ] **TLS/HTTPS** bắt buộc (redirect HTTP → HTTPS)
- [ ] **HSTS** header với max-age dài
- [ ] **CORS** whitelist chỉ domains cho phép
- [ ] **Helmet.js** cho security headers
- [ ] **Rate limiting** theo IP + account
- [ ] **Account lockout** sau N lần đăng nhập thất bại
- [ ] **Argon2id** cho password hashing (không bcrypt)
- [ ] **JWT** với expiry ngắn (15m access, 7d refresh)
- [ ] **Refresh token rotation** + family tracking
- [ ] **Session invalidation** khi đổi password
- [ ] **Audit logging** cho mọi action nhạy cảm
- [ ] **Input validation** với Zod ở mọi endpoint
- [ ] **SQL/NoSQL injection** prevention
- [ ] **Secrets** qua environment variables
- [ ] **Dependency scanning** (npm audit, Snyk)
- [ ] **Error messages** không leak internal info

### 7.3 Environment Variables

```bash
# .env.example
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/vault-protector

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_ACCESS_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=another-256-bit-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Argon2 (server-side for auth verifier)
ARGON2_MEMORY=65536
ARGON2_ITERATIONS=3
ARGON2_PARALLELISM=4

# Email (BullMQ worker)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@vault-protector.app

# Security
CORS_ORIGINS=http://localhost:3000,https://vault-protector.app
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

- Services: mock repositories
- Crypto utilities: known test vectors
- Validation schemas: edge cases

### 8.2 Integration Tests

- API endpoints: supertest + mongodb-memory-server + ioredis-mock
- Auth flows: full register → login → refresh → logout
- Vault sync: version conflicts, concurrent updates

### 8.3 E2E Tests

- Playwright/Cypress cho web flows
- Security tests: rate limiting, token expiry, session revocation

---

## 9. Deployment

### 9.1 Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/vault-protector
      - REDIS_HOST=redis
    depends_on:
      - mongo
      - redis
    volumes:
      - ./src:/app/src

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

### 9.2 Production Checklist

- [ ] Sử dụng managed MongoDB (Atlas) hoặc replica set
- [ ] Sử dụng managed Redis (ElastiCache, Upstash)
- [ ] Container orchestration (K8s, ECS, Fly.io)
- [ ] Auto-scaling dựa trên CPU/memory
- [ ] Health checks (`/health`, `/ready`)
- [ ] Centralized logging (Datadog, Loki)
- [ ] APM/tracing (Sentry, Datadog APM)
- [ ] Secrets management (AWS Secrets Manager, Vault)
- [ ] Database backups + point-in-time recovery
- [ ] DDoS protection (Cloudflare, AWS Shield)

---

## 10. API Versioning & Evolution

- URL prefix: `/api/v1/...`
- Breaking changes → bump version (`/api/v2/...`)
- Deprecation: `Sunset` header + docs warning
- Backwards compatibility: support N-1 version for 6 months

---

*Tài liệu này là phần chi tiết Backend, tách từ [IDEA.md](../IDEA.md) chính.*
