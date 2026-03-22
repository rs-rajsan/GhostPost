import OpenAI from 'openai';
import logger from './logger';
import config from '../config';
import { MODELS } from '../config/models.config';

export class SecurityService {
    private static client: OpenAI | null = null;

    private static getClient(): OpenAI | null {
        if (!this.client && config.security.apiKey && !config.security.isMockMode) {
            this.client = new OpenAI({ apiKey: config.security.apiKey });
        }
        return this.client;
    }

    /**
     * Legacy guard logic refactored for security.util.ts
     */
    public static async scanInput(text: string): Promise<string> {
        // Redact PII
        let sanitized = text;
        if (config.guard.redactPii) {
            sanitized = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
        }
        return sanitized;
    }

    public static async scanOutput(text: string, context?: string): Promise<string> {
        // Just return text for now, or implement additional checks
        return text;
    }
}
