import { Router } from 'express';
import { sessionsController } from './sessions.controller.js';
import { authenticate, asyncHandler } from '../../middleware/index.js';
import { validate } from '../../middleware/validate.middleware.js';
import { revokeSessionParamsDto } from './sessions.dto.js';

const router = Router();

// All session routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/sessions
 * @desc    Get all active sessions
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(sessionsController.getSessions.bind(sessionsController))
);

/**
 * @route   DELETE /api/v1/sessions/:id
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete(
  '/:id',
  validate(revokeSessionParamsDto, 'params'),
  asyncHandler(sessionsController.revokeSession.bind(sessionsController))
);

/**
 * @route   DELETE /api/v1/sessions
 * @desc    Revoke all sessions except current
 * @access  Private
 */
router.delete(
  '/',
  asyncHandler(sessionsController.revokeAllSessions.bind(sessionsController))
);

export { router as sessionsRoutes };
