import { Schema, model, Document, Types } from 'mongoose';
import type { EncryptionAlgorithm } from '../types/global.js';

export interface IVault extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  // Encrypted vault data
  blob: string;

  // Encryption metadata
  encryption: {
    algorithm: EncryptionAlgorithm;
    iv: string;
    tag: string;
  };

  // Versioning for conflict resolution
  version: number;
  checksum: string;

  // Format versioning for migrations
  blobFormatVersion: number;

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
      required: [true, 'User ID is required'],
      index: true,
      unique: true, // One vault per user
    },

    blob: {
      type: String,
      required: [true, 'Vault blob is required'],
      maxlength: [10 * 1024 * 1024, 'Vault blob exceeds maximum size of 10MB'],
    },

    encryption: {
      algorithm: {
        type: String,
        required: [true, 'Encryption algorithm is required'],
        enum: ['aes-256-gcm', 'xchacha20-poly1305'],
      },
      iv: {
        type: String,
        required: [true, 'IV is required'],
      },
      tag: {
        type: String,
        required: [true, 'Auth tag is required'],
      },
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    checksum: {
      type: String,
      required: [true, 'Checksum is required'],
    },
    blobFormatVersion: {
      type: Number,
      default: 1,
      min: 1,
    },

    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'vaults',
  }
);

// Compound index for efficient queries
vaultSchema.index({ userId: 1, version: -1 });

// Remove __v when converting to JSON
vaultSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const Vault = model<IVault>('Vault', vaultSchema);
