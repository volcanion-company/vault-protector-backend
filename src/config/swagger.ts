import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './index.js';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Vault Protector API',
      version: '1.0.0',
      description: `
# Vault Protector - Secure Password Manager API

A zero-knowledge, end-to-end encrypted password manager API. 
The server never sees your master password or unencrypted data.

## Authentication Flow

1. **Prelogin**: Get KDF parameters for email
2. **Login**: Send auth verifier (derived from master password) + device info
3. **Token Refresh**: Use refresh token to get new access/refresh tokens

## Security Model

- **Zero-Knowledge**: Server stores encrypted blobs only
- **E2EE**: All vault data encrypted client-side with AES-256-GCM
- **Argon2id**: Used for both client-side key derivation and server-side auth verifier hashing
- **JWT Tokens**: Short-lived access tokens (15m) + long-lived refresh tokens (7d)
- **Token Rotation**: Refresh tokens rotate on each use with family tracking

## Rate Limits

- General API: 100 requests / 15 minutes
- Auth endpoints: 10 requests / 15 minutes
- Password reset: 3 requests / hour
      `,
      contact: {
        name: 'Vault Protector Team',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Access Token',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            details: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },

        // Auth schemas
        KdfConfig: {
          type: 'object',
          properties: {
            algorithm: { type: 'string', enum: ['argon2id', 'pbkdf2'], example: 'argon2id' },
            salt: { type: 'string', description: 'Base64-encoded salt' },
            memory: { type: 'integer', example: 65536 },
            iterations: { type: 'integer', example: 3 },
            parallelism: { type: 'integer', example: 4 },
          },
        },
        TokenPair: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'integer', description: 'Seconds until access token expires' },
          },
        },
        UserInfo: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            emailVerified: { type: 'boolean' },
          },
        },
        DeviceInfo: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            isNew: { type: 'boolean' },
          },
        },

        // Vault schemas
        EncryptionInfo: {
          type: 'object',
          properties: {
            algorithm: { type: 'string', enum: ['aes-256-gcm'], example: 'aes-256-gcm' },
            iv: { type: 'string', description: 'Base64-encoded IV' },
            authTag: { type: 'string', description: 'Base64-encoded auth tag' },
          },
        },
        VaultData: {
          type: 'object',
          properties: {
            blob: { type: 'string', description: 'Base64-encoded encrypted vault data' },
            encryption: { $ref: '#/components/schemas/EncryptionInfo' },
            checksum: { type: 'string', description: 'SHA-256 hash of blob' },
            version: { type: 'integer' },
          },
        },

        // Session schemas
        Session: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            deviceId: { type: 'string' },
            deviceName: { type: 'string' },
            ipAddress: { type: 'string' },
            userAgent: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            lastActivityAt: { type: 'string', format: 'date-time' },
            isCurrent: { type: 'boolean' },
          },
        },

        // Device schemas
        Device: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            platform: { type: 'string', enum: ['web', 'desktop-windows', 'desktop-macos', 'desktop-linux', 'mobile-ios', 'mobile-android'] },
            isTrusted: { type: 'boolean' },
            lastSeenAt: { type: 'string', format: 'date-time' },
            lastIpAddress: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // User schemas
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            emailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        AuditLogEntry: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            action: { type: 'string' },
            status: { type: 'string', enum: ['success', 'failure'] },
            ipAddress: { type: 'string' },
            userAgent: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Authentication required',
              },
            },
          },
        },
        Forbidden: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Too many requests, please try again later',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Validation failed',
                details: ['email: Invalid email format'],
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Vault', description: 'Encrypted vault operations' },
      { name: 'Sessions', description: 'Session management' },
      { name: 'Devices', description: 'Device management' },
      { name: 'Users', description: 'User profile and account' },
    ],
  },
  apis: ['./src/docs/*.yaml', './src/modules/*/*.routes.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
