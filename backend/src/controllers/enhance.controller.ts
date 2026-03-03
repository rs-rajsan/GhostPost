import { Request, Response } from 'express';
import { z } from 'zod';
import * as llmService from '../services/llm.service';
import logger from '../utils/logger';

const enhanceSchema = z.object({
    text: z.string().min(10).max(5000),
    tone: z.enum(['Professional', 'Conversational', 'Storytelling', 'Bold/Contrarian']),
});

export const enhance = async (req: Request, res: Response) => {
    try {
        const { text, tone } = enhanceSchema.parse(req.body);

        logger.info({ tone, textLength: text.length }, 'Processing enhance request');

        const result = await llmService.enhancePost(text, tone);

        res.status(200).json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.issues });
        }

        logger.error({ error }, 'Unexpected error in enhance controller');
        res.status(500).json({ error: 'Internal server error' });
    }
};
