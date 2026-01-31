import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate, asyncHandler } from '../../middleware/index.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authLimiter, preloginLimiter } from '../../middleware/rate-limit.middleware.js';
import {
  registerDto,
  loginDto,
  preloginQueryDto,
  refreshTokenDto,
  changePasswordDto,
  setMasterPasswordDto,
} from './auth.dto.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validate(registerDto, 'body'),
  asyncHandler(authController.register.bind(authController))
);

/**
 * @route   GET /api/v1/auth/prelogin
 * @desc    Get KDF parameters for login
 * @access  Public
 */
router.get(
  '/prelogin',
  preloginLimiter,
  validate(preloginQueryDto, 'query'),
  asyncHandler(authController.prelogin.bind(authController))
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validate(loginDto, 'body'),
  asyncHandler(authController.login.bind(authController))
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public (with refresh token)
 */
router.post(
  '/refresh',
  validate(refreshTokenDto, 'body'),
  asyncHandler(authController.refresh.bind(authController))
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (revoke session)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout.bind(authController))
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordDto, 'body'),
  asyncHandler(authController.changePassword.bind(authController))
);

/**
 * @route   POST /api/v1/auth/set-master-password
 * @desc    Set Master Password for users who registered without one
 * @access  Private
 */
router.post(
  '/set-master-password',
  authenticate,
  validate(setMasterPasswordDto, 'body'),
  asyncHandler(authController.setMasterPassword.bind(authController))
);

export { router as authRoutes };
