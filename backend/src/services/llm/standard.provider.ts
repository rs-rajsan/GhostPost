import OpenAI from 'openai';
import { LLMProvider, PromptPayload, LLMOptions } from './provider.interface';
import config from '../../config';
import logger from '../../utils/logger';

export class StandardProvider implements LLMProvider {
    private client: OpenAI | null = null;

    constructor() {
        const apiKey = config.security.apiKey;
        if (!config.security.isMockMode && apiKey) {
            this.client = new OpenAI({ 
                apiKey,
                baseURL: config.helicone.enabled ? config.helicone.baseUrl : undefined
            });
        }
    }

    getName(): string {
        return 'Standard';
    }

    async generateText(payload: PromptPayload[], options?: LLMOptions): Promise<string> {
        if (!this.client) {
            logger.warn('Standard provider in mock mode. Returning mock data.');
            return JSON.stringify({
                enhancedPost: `(MOCK RESULT) Polished version via Standard Mock Mode.`,
                hookScore: 8,
                hookTip: "This is a mock tip.",
                hashtags: ["#mock"]
            });
        }

        try {
            const response = await this.client.chat.completions.create({
                model: config.security.model,
                messages: payload.map(p => ({ role: p.role, content: p.content })),
                max_tokens: options?.maxTokens || 1000,
                response_format: options?.responseFormat ? { type: options.responseFormat } : undefined,
                temperature: options?.temperature || 0.7,
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error('No content received from Standard provider');

            return content;
        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to generate text with Standard provider');
            throw error;
        }
    }
}
