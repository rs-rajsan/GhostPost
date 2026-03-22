import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { LLMProvider, PromptPayload, LLMOptions } from './provider.interface';
import config from '../../config';
import logger from '../../utils/logger';

export class AuditProvider implements LLMProvider {
    private client: GoogleGenerativeAI | null = null;

    constructor() {
        const apiKey = config.validation.apiKey;
        if (!config.validation.isMockMode && apiKey) {
            this.client = new GoogleGenerativeAI(apiKey);
        }
    }

    getName(): string {
        return 'Audit';
    }

    async generateText(payload: PromptPayload[], options?: LLMOptions): Promise<string> {
        if (!this.client) {
            logger.warn('Audit provider in mock mode. Returning mock data.');
            return JSON.stringify({
                enhancedPost: `(MOCK RESULT) Polished version via Audit Mock Mode.`,
                hookScore: 8,
                hookTip: "This is a mock tip.",
                hashtags: ["#mock"]
            });
        }

        try {
            const model = this.client.getGenerativeModel({ 
                model: config.validation.model,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ]
            });

            // Map roles. 
            const systemPrompt = payload.find(p => p.role === 'system')?.content || '';
            const userPrompt = payload.find(p => p.role === 'user')?.content || '';
            
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            if (!text) throw new Error('No content received from Audit provider');

            return text;
        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to generate text with Audit provider');
            throw error;
        }
    }
}
