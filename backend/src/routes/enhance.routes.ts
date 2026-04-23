import { Router } from 'express';
import * as enhanceController from '../controllers/enhance.controller';

const router = Router();

router.post('/', enhanceController.enhance);
router.get('/status/:requestId', enhanceController.streamStatus);
router.post('/generate-hook', enhanceController.generateHook);

export default router;
