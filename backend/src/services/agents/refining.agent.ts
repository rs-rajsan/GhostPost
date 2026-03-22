import { BaseAgent, AgentResponse } from './base.agent';
import config from '../../config';
import { ValidationResult } from './validation.agent';
import { AuditProvider } from '../llm/audit.provider';

export class RefiningAgent extends BaseAgent {
    private provider: AuditProvider;

    constructor() {
        super('RefiningAgent');
        this.provider = new AuditProvider();
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

            let text = await this.provider.generateText([
                { role: 'user', content: prompt }
            ]);

            text = text.replace(/```json\n?|\n?```/g, '').trim();

            return { success: true, data: text };
        } catch (error: any) {
            this.logError('Refinement failed', error);
            return { success: false, data: content, error: error.message };
        }
    }
}
