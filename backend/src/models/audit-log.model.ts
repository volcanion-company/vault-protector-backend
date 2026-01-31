import { Schema, model, Document, Types } from 'mongoose';
import type { AuditAction } from '../types/global.js';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;

  action: AuditAction;
  status: 'success' | 'failure';

  // Context metadata
  metadata: {
    ipAddress: string;
    userAgent: string;
    deviceId?: string;
    sessionId?: string;
    reason?: string;
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

    action: {
      type: String,
      required: [true, 'Action is required'],
      index: true,
      enum: [
        'user.register',
        'user.login',
        'user.login.failed',
        'user.logout',
        'user.password.change',
        'user.email.verify',
        'vault.sync',
        'vault.update',
        'session.create',
        'session.revoke',
        'device.add',
        'device.remove',
        'device.trust',
      ],
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: [true, 'Status is required'],
    },

    metadata: {
      type: Schema.Types.Mixed,
      required: [true, 'Metadata is required'],
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
auditLogSchema.index({ 'metadata.ipAddress': 1, createdAt: -1 });

// TTL index - automatically delete logs older than 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to log an action
auditLogSchema.statics.logAction = async function (
  action: AuditAction,
  status: 'success' | 'failure',
  metadata: IAuditLog['metadata'],
  userId?: Types.ObjectId
): Promise<IAuditLog> {
  return this.create({
    userId,
    action,
    status,
    metadata,
  });
};

// Remove __v when converting to JSON
auditLogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
