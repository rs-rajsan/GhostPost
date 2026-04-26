import { Router } from 'express';
import { researchLatestNews } from '../controllers/research.controller';

const router = Router();

router.post('/', researchLatestNews);

export default router;
