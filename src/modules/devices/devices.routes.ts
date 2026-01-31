import { Router } from 'express';
import { devicesController } from './devices.controller.js';
import { authenticate, asyncHandler } from '../../middleware/index.js';
import { validate } from '../../middleware/validate.middleware.js';
import { deviceParamsDto, updateDeviceDto } from './devices.dto.js';

const router = Router();

// All device routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/devices
 * @desc    Get all devices
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(devicesController.getDevices.bind(devicesController))
);

/**
 * @route   PATCH /api/v1/devices/:id
 * @desc    Update device name
 * @access  Private
 */
router.patch(
  '/:id',
  validate(deviceParamsDto, 'params'),
  validate(updateDeviceDto, 'body'),
  asyncHandler(devicesController.updateDevice.bind(devicesController))
);

/**
 * @route   DELETE /api/v1/devices/:id
 * @desc    Delete a device
 * @access  Private
 */
router.delete(
  '/:id',
  validate(deviceParamsDto, 'params'),
  asyncHandler(devicesController.deleteDevice.bind(devicesController))
);

/**
 * @route   POST /api/v1/devices/cleanup
 * @desc    Cleanup duplicate devices (keeps most recently active one for each name+platform)
 * @access  Private
 */
router.post(
  '/cleanup',
  asyncHandler(devicesController.cleanupDuplicates.bind(devicesController))
);

/**
 * @route   POST /api/v1/devices/:id/trust
 * @desc    Mark device as trusted
 * @access  Private
 */
router.post(
  '/:id/trust',
  validate(deviceParamsDto, 'params'),
  asyncHandler(devicesController.trustDevice.bind(devicesController))
);

export { router as devicesRoutes };
