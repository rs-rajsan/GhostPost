import OpenAI from 'openai';
import { BaseAgent, AgentResponse } from './base.agent';
import config from '../../config';

export class SecurityAgent extends BaseAgent {
    private client: OpenAI | null = null;

    constructor() {
        super('SecurityAgent');
        const apiKey = config.security.apiKey;
        if (!config.security.isMockMode && apiKey) {
            this.client = new OpenAI({ 
                apiKey,
                baseURL: config.helicone.enabled ? config.helicone.baseUrl : undefined
            });
        }
    }

    /**
     * Scans inbound user input for injections, PII, and toxicity.
     */
    public async scanInbound(text: string): Promise<AgentResponse> {
        this.log('Scanning inbound content...');
        
        try {
            // 1. Toxicity Check
            await this.checkToxicity(text);

            // 2. PII Redaction
            let sanitized = text;
            if (config.guard.redactPii) {
                sanitized = this.redactPII(text);
            }

            // 3. Prompt Injection Protection
            if (config.guard.promptProtection) {
                this.detectInjection(text);
            }

            return { success: true, data: sanitized };
        } catch (error: any) {
            this.logError('Inbound security violation', error);
            return { success: false, data: text, error: error.message };
        }
    }

    /**
     * Scans outbound content for sensitive data leaks or quality violations.
     */
    public async scanOutbound(text: string): Promise<AgentResponse> {
        this.log('Scanning outbound content...');
        
        try {
            await this.checkToxicity(text);
            return { success: true, data: text };
        } catch (error: any) {
            this.logError('Outbound security violation', error);
            return { success: false, data: text, error: error.message };
        }
    }

    private redactPII(text: string): string {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        
        return text
            .replace(emailRegex, '[EMAIL_REDACTED]')
            .replace(phoneRegex, '[PHONE_REDACTED]');
    }

    private detectInjection(text: string) {
        const patterns = [
            /ignore previous instructions/i,
            /system prompt/i,
            /you are now/i,
            /dan mode/i
        ];

        for (const pattern of patterns) {
            if (pattern.test(text)) {
                throw new Error('Potential Prompt Injection detected');
            }
        }
    }

    private async checkToxicity(text: string) {
        if (!this.client || !config.guard.filterToxicity) return;

        const moderation = await this.client.moderations.create({ 
            input: text 
        }, {
            headers: this.getHeliconeHeaders('toxicity-check')
        });
        const result = moderation.results[0];

        if (result.flagged) {
            const categories = Object.entries(result.categories)
                .filter(([_, flagged]) => flagged)
                .map(([cat]) => cat);
            throw new Error(`Content flagged for: ${categories.join(', ')}`);
        }
    }
}
