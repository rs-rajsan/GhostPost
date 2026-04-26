import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';

const router = Router();

// GET /api/admin/metrics
router.get('/metrics', adminController.getDashboardMetrics);

export default router;
