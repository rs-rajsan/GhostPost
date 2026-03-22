import { OpenAI as StandardClient } from 'openai';
import { LLMProvider, PromptPayload, LLMOptions } from './provider.interface';
import config from '../../config';
import logger from '../../utils/logger';

export class RefinementProvider implements LLMProvider {
    private client: StandardClient | null = null;

    constructor() {
        const apiKey = config.refinement.apiKey;
        if (!config.refinement.isMockMode && apiKey) {
            this.client = new StandardClient({ 
                apiKey,
                baseURL: config.helicone.enabled ? config.helicone.baseUrl : undefined
            });
        }
    }

    getName(): string {
        return 'Refinement';
    }

    async generateText(payload: PromptPayload[], options?: LLMOptions): Promise<string> {
        if (!this.client) {
            logger.warn('Refinement provider in mock mode. Returning mock data.');
            return JSON.stringify({
                enhancedPost: `(MOCK RESULT) Refined version via Refinement Mock Mode.`,
                hookScore: 10,
                hookTip: "This is a mock refinement tip.",
                hashtags: ["#mock", "#refined"]
            });
        }

        try {
            const response = await this.client.chat.completions.create({
                model: config.refinement.model,
                messages: payload.map(p => ({ role: p.role, content: p.content })),
                max_tokens: options?.maxTokens || 2000,
                response_format: options?.responseFormat ? { type: options.responseFormat } : undefined,
                temperature: options?.temperature || 0.3, // Lower temperature for refinement
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error('No content received from Refinement provider');

            return content;
        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to generate text with Refinement provider');
            throw error;
        }
    }
}
