import { Schema, model, Document, Types } from 'mongoose';
import type { UserStatus, KdfAlgorithm } from '../types/global.js';

// User interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;

  // Authentication (server-side verifier, NOT the master key)
  auth: {
    verifierHash: string;
    algorithm: string;
    version: number;
  };

  // KDF parameters (shared with client)
  kdf: {
    algorithm: KdfAlgorithm;
    salt: string;
    memory: number;
    iterations: number;
    parallelism: number;
  };

  // Encrypted vault key (optional until Master Password is set)
  wrappedVaultKey?: string | null;

  // Flag to indicate if Master Password has been set
  hasMasterPassword: boolean;

  // Account status
  status: UserStatus;
  failedLoginAttempts: number;
  lockoutUntil?: Date;

  // Recovery
  recoveryKeyHash?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
}

// User methods interface
export interface IUserMethods {
  isLocked(): boolean;
  incrementFailedAttempts(): Promise<void>;
  resetFailedAttempts(): Promise<void>;
}

// User model type
export type UserModel = IUser & IUserMethods;

// Type for Model with methods
import { Model } from 'mongoose';
type UserModelType = Model<IUser, object, IUserMethods>;

const userSchema = new Schema<IUser, UserModelType, IUserMethods>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    auth: {
      verifierHash: {
        type: String,
        required: [true, 'Auth verifier is required'],
      },
      algorithm: {
        type: String,
        default: 'argon2id',
      },
      version: {
        type: Number,
        default: 1,
      },
    },

    kdf: {
      algorithm: {
        type: String,
        default: 'argon2id',
        enum: ['argon2id', 'pbkdf2'], // Support both algorithms
      },
      salt: {
        type: String,
        required: [true, 'KDF salt is required'],
      },
      memory: {
        type: Number,
        default: 65536,
        min: 0, // 0 for PBKDF2 (doesn't use memory)
        max: 1048576,
      },
      iterations: {
        type: Number,
        default: 3,
        min: 1,
        max: 1000000, // Up to 1M for PBKDF2
      },
      parallelism: {
        type: Number,
        default: 4,
        min: 1,
        max: 16,
      },
    },

    wrappedVaultKey: {
      type: String,
      required: false, // Optional - set when user creates Master Password
      default: null,
    },

    // Flag to indicate if Master Password has been set
    hasMasterPassword: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ['active', 'locked', 'suspended'],
      default: 'active',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
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
userSchema.index({ status: 1 });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });
userSchema.index({ lockoutUntil: 1 }, { sparse: true });

// Instance methods
userSchema.methods.isLocked = function (): boolean {
  if (this.status === 'locked') return true;
  if (this.lockoutUntil && this.lockoutUntil > new Date()) return true;
  return false;
};

userSchema.methods.incrementFailedAttempts = async function (): Promise<void> {
  this.failedLoginAttempts += 1;

  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.status = 'locked';
    this.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }

  await this.save();
};

userSchema.methods.resetFailedAttempts = async function (): Promise<void> {
  if (this.failedLoginAttempts > 0 || this.lockoutUntil) {
    this.failedLoginAttempts = 0;
    this.lockoutUntil = undefined;
    if (this.status === 'locked') {
      this.status = 'active';
    }
    await this.save();
  }
};

// Remove sensitive fields when converting to JSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.auth;
    delete obj.emailVerificationToken;
    delete obj.recoveryKeyHash;
    delete obj.__v;
    return obj;
  },
});

export const User = model<IUser, UserModelType>('User', userSchema);
