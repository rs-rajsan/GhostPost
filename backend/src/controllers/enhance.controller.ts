import { Request, Response } from 'express';
import { z } from 'zod';
import * as llmService from '../services/llm.service';
import * as extractionService from '../services/extraction.service';
import logger from '../utils/logger';

const enhanceSchema = z.object({
    inputType: z.enum(['text', 'article', 'youtube']).default('text'),
    text: z.string().min(10).max(200000),
    mode: z.enum(['post', 'article']).default('post'),
    targetPages: z.number().min(1).max(10).default(2),
    deepResearch: z.boolean().default(false)
});

export const enhance = async (req: Request, res: Response) => {
    try {
        const { text, inputType, mode, targetPages, deepResearch } = enhanceSchema.parse(req.body);

        logger.info({ inputType, textLength: text.length, mode, targetPages, deepResearch }, 'Processing enhance request via Multi-Agent System');

        // Strategy Pattern for Extraction
        type ExtractorFunction = (input: string) => Promise<string> | string;
        
        const extractionStrategies: Record<string, ExtractorFunction> = {
            'text': (input: string) => input, 
            'article': extractionService.extractArticleContent,
            'youtube': extractionService.extractYoutubeTranscript
        };

        const extractor = extractionStrategies[inputType];
        if (!extractor) {
            return res.status(400).json({ error: `Unsupported input type: ${inputType}` });
        }

        const contentToEnhance = await extractor(text);

        // Core Pipeline Delegation
        const result = await llmService.enhancePost(contentToEnhance, {
            mode,
            targetPages,
            deepResearch // Pass the flag directly to the multi-agent orchestrator
        });

        res.status(200).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.issues });
        }

        logger.error({ error }, 'Unexpected error in content enhancement');
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

const generateHookSchema = z.object({
    text: z.string().min(10).max(200000),
    tone: z.string(),
    hookTip: z.string()
});

export const generateHook = async (req: Request, res: Response) => {
    try {
        const { text, tone, hookTip } = generateHookSchema.parse(req.body);
        
        logger.info({ tone, textLength: text.length }, 'Processing hook generation via Security & Drafting Agents');

        const hook = await llmService.generateHook(text, tone, hookTip);
        
        res.status(200).json({ hook });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.issues });
        }

        logger.error({ error }, 'Unexpected error in hook generation');
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
