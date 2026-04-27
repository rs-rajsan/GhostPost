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
            Act as an Expert Human Ghostwriter and Content Polisher.
            Your mission is to "Humanize" the "Draft Content" while addressing the "Audit Findings".

            DRAFT CONTENT:
            """
            ${content}
            """

            AUDIT FINDINGS:
            - Hallucinations to fix: ${audit.hallucinations.join(', ') || 'None'}
            - Quality Score: ${audit.qualityScore}/10
            - Suggestions: ${audit.suggestions.join(', ')}

            HUMANIZATION REQUIREMENTS:
            1. RHYTHM & FLOW: Break up monotonous sentence structures. If three sentences in a row are the same length, shorten one and lengthen another.
            2. CLICHÉ REPLACEMENT: Replace academic transitions (Additionally, Furthermore, Consequently) with natural human alternatives (On top of that, Plus, So, What's more).
            3. VOICE INJECTION: Add subtle "Human Markers" like parenthetical asides, rhetorical questions, or "Insider" phrases (e.g., "Truth be told," "Here's why this matters").
            4. REMOVE ALL HALUCINATIONS: Ensure the content strictly follows the Audit Findings regarding factual errors.
            5. MAINTAIN STRUCTURE: Keep the [TITLE], [HOOK], [CONTENT], etc. tags intact.

            RESPONSE:
            Return ONLY the updated content.
            `;

            let text = await this.withRetry(async () => {
                return await this.provider.generateText([
                    { role: 'user', content: prompt }
                ]);
            });

            return { success: true, data: text };
        } catch (error: any) {
            this.logError('Refinement failed', error);
            return { success: false, data: content, error: error.message };
        }
    }
}
