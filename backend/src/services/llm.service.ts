import logger from '../utils/logger';
import { AgentOrchestrator } from './orchestrator.service';

const orchestrator = new AgentOrchestrator();

export interface ToneResponse {
    enhancedPost: string;
    hookScore: number;
    hookTip: string;
    hashtags: string[];
}

export type EnhancePostResponse = Record<'Professional' | 'Conversational' | 'Storytelling' | 'Bold/Contrarian', ToneResponse>;

export type EnhancementMode = 'post' | 'article';

interface EnhanceOptions {
    mode?: EnhancementMode;
    targetPages?: number;
    researchData?: string;
    deepResearch?: boolean;
    provider?: string;
}

/**
 * Enhanced Post generation using the multi-agent orchestrator.
 */
export const enhancePost = async (text: string, options: EnhanceOptions = {}): Promise<EnhancePostResponse> => {
    logger.info({ textLength: text.length, mode: options.mode }, 'Enhancing content via Multi-Agent Orchestrator');

    const tones = ['Professional', 'Conversational', 'Storytelling', 'Bold/Contrarian'] as const;

    try {
        const results = await Promise.all(
            tones.map(async (tone) => {
                const result = await orchestrator.runEnhancementPipeline(text, {
                    text, // Added missing property
                    mode: options.mode === 'article' ? 'article' : 'post',
                    tone,
                    targetPages: options.targetPages,
                    researchTopic: options.deepResearch ? text : undefined 
                });

                try {
                    const cleanContent = result.finalContent.replace(/```json\n?|\n?```/g, '').trim();
                    return JSON.parse(cleanContent) as ToneResponse;
                } catch (e) {
                    logger.error({ tone, raw: result.finalContent }, 'Failed to parse orchestrator output as JSON');
                    throw new Error(`Agent failed to produce valid JSON for tone: ${tone}`);
                }
            })
        );

        logger.info('Successfully enhanced content across all tones');
        
        return tones.reduce((acc, tone, index) => {
            acc[tone] = results[index];
            return acc;
        }, {} as EnhancePostResponse);
    } catch (error) {
        logger.error({ error }, 'Error in Multi-Agent enhancement');
        throw error;
    }
};

/**
 * Generate Hook using the orchestrator.
 */
export const generateHook = async (text: string, tone: string, hookTip: string): Promise<string> => {
    logger.info({ tone }, 'Generating custom hook via Multi-Agent system');

    const result = await orchestrator.runEnhancementPipeline(text, {
        text, // Added missing property
        mode: 'post',
        tone: `Focus on the HOOK: ${tone}. Strategy: ${hookTip}`,
    });

    return result.finalContent;
};
