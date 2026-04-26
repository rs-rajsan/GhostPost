import { BaseAgent, AgentResponse } from './base.agent';
import config from '../../config';
import { AuditProvider } from '../llm/audit.provider';
import { extractAndParseJson } from '../../utils/json.util';

export interface ValidationResult {
    isValid: boolean;
    qualityScore: number; // 1-10
    confidenceScore: number; // 0-100%
    hallucinations: string[];
    suggestions: string[];
}

export class ValidationAgent extends BaseAgent {
    private provider: AuditProvider;

    constructor(requestId?: string) {
        super('ValidationAgent', requestId);
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
            4. CONFIDENCE SCORE: Rate from 0-100. How much of the content is verifiable against the provided research?
            5. IMPROVEMENTS: Provide 2-3 actionable tips.

            RESPONSE FORMAT (Strict JSON):
            {
              "isValid": boolean,
              "qualityScore": number,
              "confidenceScore": number,
              "hallucinations": ["string"],
              "suggestions": ["string"]
            }
            `;

            let text = await this.withRetry(async () => {
                return await this.provider.generateText([
                    { role: 'user', content: prompt }
                ]);
            });

            const parsed = extractAndParseJson<ValidationResult>(text);
            
            // Ensure scores are numbers
            parsed.qualityScore = Number(parsed.qualityScore) || 0;
            parsed.confidenceScore = Number(parsed.confidenceScore) || 0;

            return {
                success: true,
                data: parsed,
                metadata: { model: config.validation.model }
            };
        } catch (error: any) {
            this.logError('Validation failed', error);
            return {
                success: false,
                data: { isValid: false, qualityScore: 0, confidenceScore: 0, hallucinations: [], suggestions: [] },
                error: error.message
            };
        }
    }
}
