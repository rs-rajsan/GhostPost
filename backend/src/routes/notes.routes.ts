import { Router } from 'express';
import multer from 'multer';
import { generateNotes } from '../controllers/notes.controller';

const router = Router();

// Store file purely in memory buffer for security context, we don't save.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB Limit per MVP reqs
    }
});

router.post('/', upload.single('image'), generateNotes);

export default router;
