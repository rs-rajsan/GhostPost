import { performance } from 'perf_hooks';
import logger from '../utils/logger';
import { SecurityAgent } from './agents/security.agent';
import { DraftingAgent } from './agents/drafting.agent';
import { ValidationAgent } from './agents/validation.agent';
import { RefiningAgent } from './agents/refining.agent';
import { HookAgent } from './agents/hook.agent';
import { PromptOptions } from '../config';
import config from '../config';
import { statusService } from './status.service';
import { governanceService } from './governance.service';

export interface OrchestrationResult {
    success: boolean;
    finalContent: string;
    trace: { agent: string; status: string; data?: any }[];
}

/**
 * Manages the multi-agent workflow for content enhancement with Governance and Parallelization.
 */
export class AgentOrchestrator {
    constructor() {}

    public async runEnhancementPipeline(input: string, options: PromptOptions & { mode: 'article' | 'post'; researchTopic?: string; isTopic?: boolean; requestId?: string }): Promise<OrchestrationResult> {
        const { mode, tone, targetPages = 2, researchTopic, isTopic, requestId = crypto.randomUUID() } = options;
        const trace: OrchestrationResult['trace'] = [];

        // Dependency Injection Pattern: Instantiate agents per-request with the current requestId.
        // This ensures child loggers automatically trace every agent pulse.
        const securityAgent = new SecurityAgent(requestId);
        const draftingAgent = new DraftingAgent(requestId);
        const validationAgent = new ValidationAgent(requestId);
        const refiningAgent = new RefiningAgent(requestId);
        const hookAgent = new HookAgent(requestId);

        const publishStatus = (msg: string) => {
            const prefixedMsg = tone ? `[${tone}] ${msg}` : msg;
            statusService.publish(requestId, prefixedMsg);
        };

        logger.info({ mode, tone, researchTopic, requestId }, 'Starting Optimized Agent Orchestration');

        try {
            // --- STEP 1: Inbound Security ---
            publishStatus('Scanning & sanitizing inbound content...');
            const secStart = performance.now();
            const inboundScan = await securityAgent.validateInbound(input);
            const secLat = Math.round(performance.now() - secStart);
            
            const secTokens = securityAgent.estimateTokens(input, inboundScan.data);
            await governanceService.logAction({
                requestId,
                agentName: 'SecurityAgent',
                action: 'inbound_scan',
                inputSnapshot: input,
                outputSnapshot: inboundScan.data,
                latencyMs: secLat,
                modelUsed: config.security.model,
                tokenUsage: secTokens,
                cost: securityAgent.calculateCost(secTokens)
            });

            trace.push({ agent: 'SecurityAgent', status: 'inbound_complete' });
            if (!inboundScan.success) throw new Error(inboundScan.error || 'Inbound security violation');
            const sanitizedInput = inboundScan.data;

            // --- STEP 2: Research ---
            let researchData = '';
            if (researchTopic) {
                publishStatus('Performing web research...');
                const resStart = performance.now();
                const researchResult = await draftingAgent.research(researchTopic);
                const resLat = Math.round(performance.now() - resStart);
                
                researchData = researchResult.success ? researchResult.data : '';
                const resTokens = draftingAgent.estimateTokens(researchTopic, researchData);
                await governanceService.logAction({
                    requestId,
                    agentName: 'DraftingAgent',
                    action: 'research',
                    inputSnapshot: researchTopic,
                    outputSnapshot: researchData,
                    latencyMs: resLat,
                    modelUsed: 'sonar',
                    tokenUsage: resTokens,
                    cost: draftingAgent.calculateCost(resTokens)
                });
                trace.push({ agent: 'DraftingAgent', status: 'research_complete' });
            }

            // --- STEP 3: Drafting ---
            publishStatus('Generating primary draft...');
            const draftStart = performance.now();
            const draftingResult = await draftingAgent.draft({
                mode,
                tone,
                text: sanitizedInput,
                targetPages,
                researchData,
                isTopic
            });
            const draftLat = Math.round(performance.now() - draftStart);
            
            trace.push({ agent: 'DraftingAgent', status: 'drafting_complete' });
            if (!draftingResult.success) throw new Error(draftingResult.error || 'Drafting failed');
            let currentContent = draftingResult.data;

            const draftTokens = draftingAgent.estimateTokens(sanitizedInput + researchData, currentContent);
            await governanceService.logAction({
                requestId,
                agentName: 'DraftingAgent',
                action: 'drafting',
                inputSnapshot: sanitizedInput,
                outputSnapshot: currentContent,
                latencyMs: draftLat,
                modelUsed: config.drafting.model,
                tokenUsage: draftTokens,
                cost: draftingAgent.calculateCost(draftTokens)
            });

            // --- STEP 4: PARALLEL INTELLIGENCE ---
            publishStatus('Analyzing & refining in parallel...');
            const parallelStart = performance.now();
            const [validationResult, hookResult] = await Promise.all([
                validationAgent.validate(currentContent, researchData),
                hookAgent.refineHooks(currentContent, tone)
            ]);
            const parallelLat = Math.round(performance.now() - parallelStart);

            // Log Validation
            const valTokens = validationAgent.estimateTokens(currentContent + researchData, JSON.stringify(validationResult.data));
            await governanceService.logAction({
                requestId,
                agentName: 'ValidationAgent',
                action: 'validation',
                inputSnapshot: currentContent,
                outputSnapshot: JSON.stringify(validationResult.data),
                latencyMs: parallelLat,
                modelUsed: config.validation.model,
                tokenUsage: valTokens,
                cost: validationAgent.calculateCost(valTokens)
            });

            // Log Hook Refinement
            const hookTokens = hookAgent.estimateTokens(currentContent, hookResult.data);
            await governanceService.logAction({
                requestId,
                agentName: 'HookAgent',
                action: 'hook_refinement',
                inputSnapshot: currentContent,
                outputSnapshot: hookResult.data,
                latencyMs: parallelLat,
                modelUsed: config.drafting.model,
                tokenUsage: hookTokens,
                cost: hookAgent.calculateCost(hookTokens)
            });

            trace.push({ agent: 'ValidationAgent', status: 'parallel_validation_complete', data: validationResult.data });
            trace.push({ agent: 'HookAgent', status: 'parallel_hook_refinement_complete' });
            
            // --- STEP 5: Refinement (Conditional) ---
            const audit = validationResult.data;
            if (audit && (!audit.isValid || audit.qualityScore < 7)) {
                publishStatus('Quality check failed. Refining article...');
                const refStart = performance.now();
                const refinementResult = await refiningAgent.refine(currentContent, audit);
                const refLat = Math.round(performance.now() - refStart);
                
                if (refinementResult.success) {
                    currentContent = refinementResult.data;
                    const refTokens = refiningAgent.estimateTokens(JSON.stringify(audit), currentContent);
                    await governanceService.logAction({
                        requestId,
                        agentName: 'RefiningAgent',
                        action: 'refinement',
                        inputSnapshot: JSON.stringify(audit),
                        outputSnapshot: currentContent,
                        latencyMs: refLat,
                        modelUsed: config.refinement.model,
                        tokenUsage: refTokens,
                        cost: refiningAgent.calculateCost(refTokens)
                    });
                }
                trace.push({ agent: 'RefiningAgent', status: 'refinement_complete' });
            }

            // --- STEP 6: Outbound Security ---
            publishStatus('Final security scan...');
            const outSecStart = performance.now();
            const outboundScan = await securityAgent.validateOutbound(currentContent);
            const outSecLat = Math.round(performance.now() - outSecStart);

            const outSecTokens = securityAgent.estimateTokens(currentContent, outboundScan.data);
            await governanceService.logAction({
                requestId,
                agentName: 'SecurityAgent',
                action: 'outbound_scan',
                inputSnapshot: currentContent,
                outputSnapshot: outboundScan.data,
                latencyMs: outSecLat,
                modelUsed: config.security.model,
                tokenUsage: outSecTokens,
                cost: securityAgent.calculateCost(outSecTokens)
            });
            
            publishStatus('Enhanced content successfully');
            return {
                success: true,
                finalContent: outboundScan.data,
                trace
            };

        } catch (error: any) {
            logger.error({ error: error.message, requestId }, 'Orchestration failed');
            return {
                success: false,
                finalContent: input,
                trace: [...trace, { agent: 'Orchestrator', status: 'failed', data: error.message }]
            };
        }
    }
}
