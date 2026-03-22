import axios from 'axios';
import { BaseAgent, AgentResponse } from './base.agent';
import config, { PromptOptions } from '../../config';

export class DraftingAgent extends BaseAgent {
    constructor() {
        super('DraftingAgent');
    }

    /**
     * Gathers real-time research and statistics on a topic.
     */
    public async research(topic: string): Promise<AgentResponse> {
        this.log('Performing web research...', { topic });

        if (config.drafting.isMockMode) {
            return {
                success: true,
                data: this.getMockResearch(topic),
                metadata: { source: 'mock' }
            };
        }

        try {
            const baseUrl = config.helicone.enabled ? config.helicone.baseUrl : config.drafting.url;
            const response = await axios.post(baseUrl, {
                model: config.drafting.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a research assistant. Provide concise, factual information with statistics.'
                    },
                    {
                        role: 'user',
                        content: `Research the following topic and provide key facts and statistics: ${topic}`
                    }
                ],
                max_tokens: 1000,
            }, {
                headers: {
                    'Authorization': `Bearer ${config.drafting.apiKey}`,
                    'Content-Type': 'application/json',
                    ...this.getHeliconeHeaders('research')
                }
            });

            const content = response.data.choices[0].message.content;
            if (!content) throw new Error('No content returned from Research Agent');

            return { success: true, data: content, metadata: { model: config.drafting.model } };
        } catch (error: any) {
            this.logError('Research failed', error);
            return { 
                success: false, 
                data: `Research unavailable: ${error.message}`, 
                error: error.message 
            };
        }
    }

    /**
     * Generates an initial draft (Article or Post) based on input and research.
     */
    public async draft(options: PromptOptions & { mode: 'article' | 'post' }): Promise<AgentResponse> {
        this.log('Generating draft...', { mode: options.mode, tone: options.tone });

        const prompt = options.mode === 'article' 
            ? config.prompts.article(options)
            : config.prompts.post(options);

        if (config.drafting.isMockMode) {
            return {
                success: true,
                data: JSON.stringify({
                    enhancedPost: `(MOCK) Draft for ${options.tone} tone.`,
                    hookScore: 7,
                    hookTip: "Try a more controversial opening.",
                    hashtags: ["#mock", "#drafting"]
                })
            };
        }

        try {
            const baseUrl = config.helicone.enabled ? config.helicone.baseUrl : config.drafting.url;
            const response = await axios.post(baseUrl, {
                model: config.drafting.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an elite copywriter and ghostwriter.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: options.mode === 'article' ? 4000 : 1000,
                response_format: { type: 'json_object' }
            }, {
                headers: {
                    'Authorization': `Bearer ${config.drafting.apiKey}`,
                    'Content-Type': 'application/json',
                    ...this.getHeliconeHeaders(`drafting-${options.mode}`)
                }
            });

            let content = response.data.choices[0].message.content;
            if (!content) throw new Error('No content returned from Drafting Agent');

            // Cleanup potential markdown fences if returned erroneously
            content = content.replace(/```json\n?|\n?```/g, '').trim();

            return { success: true, data: content };
        } catch (error: any) {
            this.logError('Drafting failed', error);
            return { success: false, data: '', error: error.message };
        }
    }

    private getMockResearch(topic: string): string {
        return `
            Mock Research Data for: "${topic}"
            - Stat 1: 75% of professionals believe ${topic} will impact their industry by 2030.
            - Fact 2: Industry leaders have seen a 20% increase in productivity when using ${topic} frameworks.
            - Trend 3: Global investment in ${topic}-related technologies reached $50B last year.
        `;
    }
}
