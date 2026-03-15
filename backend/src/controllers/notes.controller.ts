import { Request, Response } from 'express';
import * as visionService from '../services/vision.service';
import logger from '../utils/logger';

export const generateNotes = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' });
        }

        // Limit size to strictly 5MB as per MVP scaling/security req
        if (req.file.buffer.length > 5 * 1024 * 1024) {
            return res.status(413).json({ error: 'File size exceeds 5MB limit' });
        }

        const baseStr = req.file.buffer.toString('base64');
        const notesMarkdown = await visionService.synthesizeImageToNotes(baseStr, req.file.mimetype);

        res.status(200).json({ notes: notesMarkdown });
    } catch (error: any) {
        logger.error({ error }, 'Unexpected error in notes controller');
        res.status(500).json({ error: error.message || 'Internal server error while processing image' });
    }
};
