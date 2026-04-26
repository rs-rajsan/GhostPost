import { BaseAgent, AgentResponse } from './base.agent';
import config from '../../config';
import { ValidationResult } from './validation.agent';
import { RefinementProvider } from '../llm/refinement.provider';
import { extractAndParseJson, extractJsonString } from '../../utils/json.util';

export class RefiningAgent extends BaseAgent {
    private provider: RefinementProvider;

    constructor(requestId?: string) {
        super('RefiningAgent', requestId);
        this.provider = new RefinementProvider();
    }

    /**
     * Polishes the draft based on validation feedback (hallucinations, quality).
     */
    public async refine(content: string, audit: ValidationResult): Promise<AgentResponse> {
        this.log('Refining content based on validation audit...');

        try {

            const prompt = `
            Act as an Expert Content Polisher.
            Fix the following "Draft Content" based on these "Audit Findings".
            
            DRAFT CONTENT:
            """
            ${content}
            """

            AUDIT FINDINGS:
            - Hallucinations to fix: ${audit.hallucinations.join(', ') || 'None'}
            - Quality Score: ${audit.qualityScore}/10
            - Suggestions: ${audit.suggestions.join(', ')}

            REQUIREMENTS:
            1. REMOVE all hallucinated facts.
            2. IMPROVE flow and punchiness based on suggestions.
            3. MAINTAIN the original JSON structure.

            RESPONSE:
            Return ONLY the updated JSON draft.
            `;

            let text = await this.withRetry(async () => {
                return await this.provider.generateText([
                    { role: 'user', content: prompt }
                ]);
            });

            const cleaned = extractJsonString(text);
            return { success: true, data: cleaned };
        } catch (error: any) {
            this.logError('Refinement failed', error);
            return { success: false, data: content, error: error.message };
        }
    }
}
