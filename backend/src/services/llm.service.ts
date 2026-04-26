import logger from '../utils/logger';
import { AgentOrchestrator } from './orchestrator.service';
import { extractAndParseJson } from '../utils/json.util';

const orchestrator = new AgentOrchestrator();

export interface ToneResponse {
    title: string;
    hook: string;
    enhancedPost: string;
    hookScore: number;
    hookTip: string;
    confidenceScore: number;
    hashtags: string[];
    visualSuggestion?: string;
}

export type EnhancePostResponse = Record<'Professional' | 'Conversational' | 'Storytelling' | 'Bold/Contrarian', ToneResponse>;

export type EnhancementMode = 'post' | 'article';

interface EnhanceOptions {
    mode?: EnhancementMode;
    targetPages?: number;
    researchData?: string;
    deepResearch?: boolean;
    isTopic?: boolean;
    provider?: string;
    requestId?: string;
    tone?: string;
}

/**
 * Enhanced Post generation using the multi-agent orchestrator.
 */
export const enhancePost = async (text: string, options: EnhanceOptions = {}): Promise<EnhancePostResponse> => {
    logger.info({ textLength: text.length, mode: options.mode, tone: options.tone }, 'Enhancing content via Multi-Agent Orchestrator');

    const tones = ['Professional', 'Conversational', 'Storytelling', 'Bold/Contrarian'] as const;
    const activeTones = options.tone 
        ? [options.tone as any] 
        : tones;

    try {
        const results = await Promise.all(
            activeTones.map(async (tone) => {
                const result = await orchestrator.runEnhancementPipeline(text, {
                    text,
                    mode: options.mode === 'article' ? 'article' : 'post',
                    tone,
                    targetPages: options.targetPages,
                    researchTopic: (options.deepResearch || options.isTopic) ? text : undefined,
                    isTopic: options.isTopic,
                    requestId: options.requestId
                });

                if (!result.success) {
                    const failTrace = result.trace.find(t => t.status === 'failed' || t.status.includes('violation'));
                    const errorMsg = failTrace?.data || 'Pipeline failed';
                    logger.error({ tone, errorMsg }, 'Orchestrator pipeline failed for tone');
                    throw new Error(`Orchestration failed for tone "${tone}": ${errorMsg}`);
                }

                try {
                    const parsed = extractAndParseJson<ToneResponse>(result.finalContent);
                    
                    // Merge confidenceScore from the validation trace
                    const validationTrace = result.trace.find(t => t.agent === 'ValidationAgent');
                    if (validationTrace?.data?.confidenceScore != null) {
                        parsed.confidenceScore = validationTrace.data.confidenceScore;
                    }
                    
                    // Strip residual markdown formatting from the LLM output
                    if (parsed.enhancedPost) {
                        parsed.enhancedPost = parsed.enhancedPost
                            .replace(/\*\*/g, '')
                            .replace(/#{1,6}\s/g, '');
                    }
                    
                    return parsed;
                } catch (e) {
                    logger.error({ tone, raw: result.finalContent }, 'Failed to parse orchestrator output as JSON');
                    throw new Error(`Agent failed to produce valid JSON for tone: ${tone}`);
                }
            })
        );

        logger.info({ tonesGenerated: activeTones.length }, 'Successfully enhanced content');
        
        return activeTones.reduce((acc, tone, index) => {
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
