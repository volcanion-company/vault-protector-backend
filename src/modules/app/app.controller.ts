/**
 * @file App Controller
 * @description Handles app-related operations like version info
 */

import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { logger } from '../../lib/logger.js';

/**
 * Get current app version info
 * @route GET /app/version
 */
export async function getAppVersion(req: Request, res: Response): Promise<void> {
  const versionInfo = {
    currentVersion: process.env.APP_VERSION || '1.0.0',
    latestVersion: process.env.APP_VERSION || '1.0.0',
    minRequiredVersion: '1.0.0',
    isForceUpdate: false,
    releaseNotes: null,
    updateUrl: null,
  };

  logger.debug('App version info requested', { 
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  sendSuccess(res, versionInfo);
}

/**
 * Get app configuration for mobile clients
 * @route GET /app/config
 */
export async function getAppConfig(req: Request, res: Response): Promise<void> {
  const appConfig = {
    features: {
      biometricAuth: true,
      autoSync: true,
      offlineMode: true,
      passwordGenerator: true,
    },
    security: {
      minMasterPasswordLength: 12,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      sessionTimeoutMinutes: 60,
    },
    sync: {
      defaultIntervalMinutes: 15,
      minIntervalMinutes: 5,
      maxIntervalMinutes: 60,
    },
  };

  sendSuccess(res, appConfig);
}

/**
 * Report client error/crash
 * @route POST /app/report-error
 */
export async function reportError(req: Request, res: Response): Promise<void> {
  const { error, stackTrace, deviceInfo, appVersion } = req.body as {
    error: string;
    stackTrace?: string;
    deviceInfo?: Record<string, unknown>;
    appVersion?: string;
  };

  logger.error('Client error reported', {
    error,
    stackTrace,
    deviceInfo,
    appVersion,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  sendSuccess(res, { received: true, message: 'Error report received' });
}
