import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  deviceId: Types.ObjectId;

  // Token management
  refreshTokenHash: string;
  accessTokenFamily: string;

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
      required: [true, 'User ID is required'],
      index: true,
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
      required: [true, 'Device ID is required'],
    },

    refreshTokenHash: {
      type: String,
      required: [true, 'Refresh token hash is required'],
    },
    accessTokenFamily: {
      type: String,
      required: [true, 'Access token family is required'],
      index: true,
    },

    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
      maxlength: 500,
    },

    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
      // Index defined below as TTL index
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: Date,
    revokedReason: String,
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

// TTL index for automatic cleanup of expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes
sessionSchema.index({ userId: 1, revokedAt: 1 });
sessionSchema.index({ userId: 1, deviceId: 1 });

// Instance method to check if session is valid
sessionSchema.methods.isValid = function (): boolean {
  if (this.revokedAt) return false;
  if (this.expiresAt < new Date()) return false;
  return true;
};

// Remove sensitive fields when converting to JSON
sessionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.refreshTokenHash;
    delete obj.__v;
    return obj;
  },
});

export const Session = model<ISession>('Session', sessionSchema);
