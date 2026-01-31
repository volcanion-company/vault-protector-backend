/**
 * @file App Routes
 * @description Routes for app-related operations
 */

import { Router } from 'express';
import { getAppVersion, getAppConfig, reportError } from './app.controller.js';
import { apiLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

/**
 * @openapi
 * /app/version:
 *   get:
 *     summary: Get app version info
 *     description: Returns current version, latest version, and update requirements
 *     tags: [App]
 *     responses:
 *       200:
 *         description: Version info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentVersion:
 *                       type: string
 *                     latestVersion:
 *                       type: string
 *                     minRequiredVersion:
 *                       type: string
 *                     isForceUpdate:
 *                       type: boolean
 *                     releaseNotes:
 *                       type: string
 *                       nullable: true
 *                     updateUrl:
 *                       type: string
 *                       nullable: true
 */
router.get('/version', getAppVersion);

/**
 * @openapi
 * /app/config:
 *   get:
 *     summary: Get app configuration
 *     description: Returns feature flags and configuration for mobile clients
 *     tags: [App]
 *     responses:
 *       200:
 *         description: Config retrieved successfully
 */
router.get('/config', getAppConfig);

/**
 * @openapi
 * /app/report-error:
 *   post:
 *     summary: Report client error
 *     description: Submit error report from mobile client
 *     tags: [App]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - error
 *             properties:
 *               error:
 *                 type: string
 *               stackTrace:
 *                 type: string
 *               deviceInfo:
 *                 type: object
 *               appVersion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Error report received
 */
router.post('/report-error', apiLimiter, reportError);

export { router as appRoutes };
