import { Schema, model, Document, Types } from 'mongoose';
import type { DevicePlatform } from '../types/global.js';

export interface IDevice extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  // Device identification
  name: string;
  platform: DevicePlatform;
  deviceIdentifier: string;

  // Security
  publicKey?: string;
  trusted: boolean;

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
      required: [true, 'User ID is required'],
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true,
      maxlength: [100, 'Device name cannot exceed 100 characters'],
    },
    platform: {
      type: String,
      enum: ['web', 'desktop-windows', 'desktop-macos', 'desktop-linux', 'ios', 'android'],
      required: [true, 'Platform is required'],
    },
    deviceIdentifier: {
      type: String,
      required: [true, 'Device identifier is required'],
    },

    publicKey: String,
    trusted: {
      type: Boolean,
      default: false,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastIpAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },
  },
  {
    timestamps: true,
    collection: 'devices',
  }
);

// Unique constraint: one device identifier per user
deviceSchema.index({ userId: 1, deviceIdentifier: 1 }, { unique: true });

// Index for listing user devices
deviceSchema.index({ userId: 1, lastSeenAt: -1 });

// Update lastSeenAt method
deviceSchema.methods.updateLastSeen = async function (ipAddress: string): Promise<void> {
  this.lastSeenAt = new Date();
  this.lastIpAddress = ipAddress;
  await this.save();
};

// Remove __v when converting to JSON
deviceSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    delete obj.deviceIdentifier; // Don't expose the identifier
    return obj;
  },
});

export const Device = model<IDevice>('Device', deviceSchema);
