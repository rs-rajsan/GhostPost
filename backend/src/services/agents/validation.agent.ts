import { BaseAgent, AgentResponse } from './base.agent';
import config from '../../config';
import { AuditProvider } from '../llm/audit.provider';

export interface ValidationResult {
    isValid: boolean;
    qualityScore: number; // 1-10
    hallucinations: string[];
    suggestions: string[];
}

export class ValidationAgent extends BaseAgent {
    private provider: AuditProvider;

    constructor() {
        super('ValidationAgent');
        this.provider = new AuditProvider();
    }

    /**
     * Validates a draft against research data for hallucinations and quality.
     */
    public async validate(content: string, context: string): Promise<AgentResponse<ValidationResult>> {
        this.log('Performing factual and structural validation...');

        try {
            const prompt = `
            Act as a Senior Editorial Auditor and Fact-Checker.
            Your mission is to audit the "Draft Content" against the "Research Context".

            RESEARCH CONTEXT:
            """
            ${context}
            """

            DRAFT CONTENT:
            """
            ${content}
            """

            AUDIT CRITERIA:
            1. HALLUCINATIONS: List any specific factual claims in the draft NOT supported by or contradicted by the context.
            2. STRUCTURE: Does it have a strong Hook, Body, and CTA?
            3. QUALITY SCORE: Rate from 1-10.
            4. IMPROVEMENTS: Provide 2-3 actionable tips.

            RESPONSE FORMAT (Strict JSON):
            {
              "isValid": boolean,
              "qualityScore": number,
              "hallucinations": ["string"],
              "suggestions": ["string"]
            }
            `;

            let text = await this.provider.generateText([
                { role: 'user', content: prompt }
            ]);

            // Cleanup
            text = text.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(text) as ValidationResult;

            return {
                success: true,
                data: parsed,
                metadata: { model: config.validation.model }
            };
        } catch (error: any) {
            this.logError('Validation failed', error);
            return {
                success: false,
                data: { isValid: false, qualityScore: 0, hallucinations: [], suggestions: [] },
                error: error.message
            };
        }
    }
}
