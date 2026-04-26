import { BaseAgent, AgentResponse } from './base.agent';
import { OpenAI as StandardClient } from 'openai';
import config from '../../config';

export class HookAgent extends BaseAgent {
    private client: StandardClient | null = null;

    constructor(requestId?: string) {
        super('HookAgent', requestId);
        const apiKey = config.drafting.apiKey;
        if (!config.drafting.isMockMode && apiKey) {
            this.client = new StandardClient({ apiKey });
        }
    }

    async refineHooks(content: string, tone: string): Promise<AgentResponse> {
        this.log('Refining viral hooks in parallel...');
        if (!this.client) return { success: true, data: '' };

        return this.withRetry(async () => {
            const response = await this.client!.chat.completions.create({
                model: config.drafting.model,
                messages: [
                    { role: 'system', content: config.prompts.hook(tone, 'Pattern Interrupt', content) }
                ]
            }, {
                headers: this.getHeliconeHeaders('hook-refinement')
            } as any);

            const hook = response.choices[0].message.content || '';
            return { success: true, data: hook };
        });
    }
}
