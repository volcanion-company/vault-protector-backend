import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate, asyncHandler } from '../../middleware/index.js';
import { validate } from '../../middleware/validate.middleware.js';
import { auditLogQueryDto, deleteAccountDto } from './users.dto.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  asyncHandler(usersController.getProfile.bind(usersController))
);

/**
 * @route   GET /api/v1/users/me/audit-logs
 * @desc    Get user's audit logs
 * @access  Private
 */
router.get(
  '/me/audit-logs',
  validate(auditLogQueryDto, 'query'),
  asyncHandler(usersController.getAuditLogs.bind(usersController))
);

/**
 * @route   DELETE /api/v1/users/me
 * @desc    Delete user account
 * @access  Private
 */
router.delete(
  '/me',
  validate(deleteAccountDto, 'body'),
  asyncHandler(usersController.deleteAccount.bind(usersController))
);

export { router as usersRoutes };
