import { Request, Response } from 'express';
import { z } from 'zod';
import * as llmService from '../services/llm.service';
import * as extractionService from '../services/extraction.service';
import logger from '../utils/logger';
import { statusService } from '../services/status.service';
import { v4 as uuidv4 } from 'uuid';
import { determineIntent } from '../utils/intent.util';

const enhanceSchema = z.object({
    inputType: z.enum(['text', 'article', 'topic']).default('text'),
    text: z.string().min(10).max(10000),
    mode: z.enum(['post', 'article']).default('post'),
    targetPages: z.number().min(0.25).max(10).default(1),
    deepResearch: z.boolean().default(false),
    requestId: z.string().optional(),
    tone: z.string().optional()
});

export const enhance = async (req: Request, res: Response) => {
    try {
        const parsedBody = enhanceSchema.parse(req.body);
        let { text, inputType, mode, targetPages, requestId: clientRequestId, tone } = parsedBody;

        // Intelligent Auto-Routing Heuristic via Utility (SRP)
        const intent = determineIntent(inputType, text);
        const isTopic = intent.isTopic;
        const deepResearch = parsedBody.deepResearch || intent.deepResearch;

        const requestId = clientRequestId || uuidv4();

        logger.info({ requestId, inputType, textLength: text.length, mode, targetPages, deepResearch, tone, isTopic }, 'Processing enhance request via Multi-Agent System');

        // Strategy Pattern for Extraction
        type ExtractorFunction = (input: string) => Promise<string> | string;
        
        const extractionStrategies: Record<string, ExtractorFunction> = {
            'text': (input: string) => input, 
            'topic': (input: string) => input, // For topics, we use the input directly as the core theme
            'article': extractionService.extractArticleContent
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
            deepResearch,
            isTopic,
            requestId,
            tone
        });

        res.status(200).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.issues });
        }

        logger.error({ error }, 'Unexpected error in content enhancement');
        
        let errorMessage = error.message || 'Internal server error';
        
        // Specific check for Token Limit errors as requested by USER
        const lowerError = errorMessage.toLowerCase();
        if (lowerError.includes('token limit') || lowerError.includes('max_tokens') || lowerError.includes('context_length')) {
            errorMessage = 'LLM token limit has been reached. Please try with a shorter topic or reduce the target length.';
        }

        res.status(500).json({ error: errorMessage });
    }
};

export const streamStatus = (req: Request, res: Response) => {
    const { requestId } = req.params;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const onStatus = (message: string) => {
        res.write(`data: ${JSON.stringify({ message })}\n\n`);
    };

    statusService.on(`status:${requestId}`, onStatus);

    req.on('close', () => {
        statusService.off(`status:${requestId}`, onStatus);
    });
};

const generateHookSchema = z.object({
    text: z.string().min(10).max(10000),
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
