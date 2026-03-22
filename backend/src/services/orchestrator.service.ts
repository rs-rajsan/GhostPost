import logger from '../utils/logger';
import { SecurityAgent } from './agents/security.agent';
import { DraftingAgent } from './agents/drafting.agent';
import { ValidationAgent } from './agents/validation.agent';
import { RefiningAgent } from './agents/refining.agent';
import { PromptOptions } from '../config';

export interface OrchestrationResult {
    success: boolean;
    finalContent: string;
    trace: { agent: string; status: string; data?: any }[];
}

/**
 * Manages the multi-agent workflow for content enhancement.
 */
export class AgentOrchestrator {
    private securityAgent: SecurityAgent;
    private draftingAgent: DraftingAgent;
    private validationAgent: ValidationAgent;
    private refiningAgent: RefiningAgent;

    constructor() {
        this.securityAgent = new SecurityAgent();
        this.draftingAgent = new DraftingAgent();
        this.validationAgent = new ValidationAgent();
        this.refiningAgent = new RefiningAgent();
    }

    /**
     * Executes the full pipeline:
     * 1. Inbound Security Scan
     * 2. Research
     * 3. Drafting
     * 4. Validation (Audit)
     * 5. Refinement (Conditional)
     * 6. Outbound Security Scan
     */
    public async runEnhancementPipeline(input: string, options: PromptOptions & { mode: 'article' | 'post'; researchTopic?: string }): Promise<OrchestrationResult> {
        const { mode, tone, targetPages = 2, researchTopic } = options;
        const trace: OrchestrationResult['trace'] = [];

        logger.info({ mode, tone, researchTopic }, 'Starting Agent Orchestration Pipeline');

        try {
            // --- STEP 1: Inbound Security ---
            const inboundScan = await this.securityAgent.validateInbound(input);
            trace.push({ agent: 'SecurityAgent', status: 'inbound_complete' });
            if (!inboundScan.success) throw new Error(inboundScan.error || 'Inbound security violation');
            const sanitizedInput = inboundScan.data;

            // --- STEP 2: Research ---
            let researchData = '';
            if (researchTopic) {
                const researchResult = await this.draftingAgent.research(researchTopic);
                researchData = researchResult.success ? researchResult.data : '';
                trace.push({ agent: 'DraftingAgent', status: 'research_complete' });
            }

            // --- STEP 3: Drafting ---
            const draftingResult = await this.draftingAgent.draft({
                mode,
                tone,
                text: sanitizedInput,
                targetPages,
                researchData
            });
            trace.push({ agent: 'DraftingAgent', status: 'drafting_complete' });
            if (!draftingResult.success) throw new Error(draftingResult.error || 'Drafting failed');
            let currentContent = draftingResult.data;

            // --- STEP 4: Validation (Audit) ---
            const validationResult = await this.validationAgent.validate(currentContent, researchData);
            trace.push({ agent: 'ValidationAgent', status: 'validation_complete', data: validationResult.data });
            
            // --- STEP 5: Refinement (Conditional) ---
            const audit = validationResult.data;
            if (audit && (!audit.isValid || audit.qualityScore < 7)) {
                logger.info({ score: audit.qualityScore }, 'Quality below threshold, triggering Refinement Agent');
                const refinementResult = await this.refiningAgent.refine(currentContent, audit);
                trace.push({ agent: 'RefiningAgent', status: 'refinement_complete' });
                if (refinementResult.success) {
                    currentContent = refinementResult.data;
                }
            }

            // --- STEP 6: Outbound Security ---
            const outboundScan = await this.securityAgent.validateOutbound(currentContent);
            trace.push({ agent: 'SecurityAgent', status: 'outbound_complete' });
            if (!outboundScan.success) throw new Error(outboundScan.error || 'Outbound security violation');

            return {
                success: true,
                finalContent: outboundScan.data,
                trace
            };

        } catch (error: any) {
            logger.error({ error: error.message }, 'Orchestration pipeline failed');
            return {
                success: false,
                finalContent: input,
                trace: [...trace, { agent: 'Orchestrator', status: 'failed', data: error.message }]
            };
        }
    }
}
