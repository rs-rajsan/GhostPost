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
        logger.info('MOCKING Gemini response for 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return JSON.stringify({
            isValid: true,
            qualityScore: 10,
            hallucinations: [],
            suggestions: ["Keep up the good work!"]
        });
    }
}
