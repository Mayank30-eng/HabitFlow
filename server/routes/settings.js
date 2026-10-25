/**
 * Settings Routes
 */

import { Router } from 'express';
import * as settingsCtrl from '../controllers/settings.controller.js';

const router = Router();

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

router.get('/', asyncHandler(settingsCtrl.getSettings));
router.put('/', asyncHandler(settingsCtrl.updateSettings));

export default router;
