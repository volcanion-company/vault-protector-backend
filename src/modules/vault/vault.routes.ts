import { Router } from 'express';
import { vaultController } from './vault.controller.js';
import { authenticate, asyncHandler } from '../../middleware/index.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateVaultDto, getVaultQueryDto } from './vault.dto.js';

const router = Router();

// All vault routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/vault
 * @desc    Get user's vault
 * @access  Private
 */
router.get(
  '/',
  validate(getVaultQueryDto, 'query'),
  asyncHandler(vaultController.getVault.bind(vaultController))
);

/**
 * @route   PUT /api/v1/vault
 * @desc    Update user's vault
 * @access  Private
 */
router.put(
  '/',
  validate(updateVaultDto, 'body'),
  asyncHandler(vaultController.updateVault.bind(vaultController))
);

/**
 * @route   GET /api/v1/vault/sync
 * @desc    Get vault sync status
 * @access  Private
 */
router.get(
  '/sync',
  asyncHandler(vaultController.getSyncStatus.bind(vaultController))
);

export { router as vaultRoutes };
