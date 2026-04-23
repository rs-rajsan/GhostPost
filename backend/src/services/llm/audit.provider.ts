import axios from 'axios';
import { LLMProvider, PromptPayload, LLMOptions } from './provider.interface';
import config from '../../config';
import logger from '../../utils/logger';

export class AuditProvider implements LLMProvider {
    constructor() {}

    getName(): string {
        return 'Audit';
    }

    async generateText(payload: PromptPayload[], options?: LLMOptions): Promise<string> {
        if (config.validation.isMockMode) {
            logger.info('MOCKING Validation response...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return JSON.stringify({
                isValid: true,
                qualityScore: 10,
                hallucinations: [],
                suggestions: ["Keep up the good work!"]
            });
        }

        try {
            const response = await axios.post('https://api.perplexity.ai/chat/completions', {
                model: config.validation.model,
                messages: payload.map(p => ({ role: p.role, content: p.content })),
                max_tokens: 1000,
            }, {
                headers: {
                    'Authorization': `Bearer ${config.validation.apiKey}`,
                    'Content-Type': 'application/json',
                }
            });

            const content = response.data.choices[0].message.content;
            if (!content) throw new Error('No content returned from Validation provider');

            return content;
        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to generate text with Audit provider');
            throw error;
        }
    }
}
