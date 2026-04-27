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
import { parseStructuredText } from '../utils/json.util';

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
            const sanitizedInput = await this.performInboundSecurity(securityAgent, input, requestId, trace);

            // --- STEP 2: Research ---
            let researchData = '';
            if (researchTopic) {
                publishStatus('Performing web research...');
                researchData = await this.performResearch(draftingAgent, researchTopic, requestId, trace);
            }

            // --- STEP 3: Drafting ---
            publishStatus('Generating primary draft...');
            let currentContent = await this.generateDraft(draftingAgent, { mode, tone, sanitizedInput, targetPages, researchData, isTopic }, requestId, trace);

            // --- STEP 4: PARALLEL INTELLIGENCE (Validation & Hooks) ---
            publishStatus('Analyzing & refining in parallel...');
            const { audit, hooks } = await this.runParallelIntelligence(validationAgent, hookAgent, currentContent, researchData, tone, requestId, trace);

            // --- STEP 5: Refinement (Conditional) ---
            const hasHallucinations = audit && audit.hallucinations && audit.hallucinations.length > 0;
            if (audit && (!audit.isValid || audit.qualityScore < 7 || hasHallucinations)) {
                publishStatus('Quality check failed. Refining article...');
                currentContent = await this.refineContent(refiningAgent, currentContent, audit, requestId, trace);
            }

            // --- STEP 6: Outbound Security ---
            publishStatus('Final security scan...');
            const finalizedContent = await this.performOutboundSecurity(securityAgent, currentContent, requestId, trace);

            // --- STEP 7: Re-assemble JSON ---
            publishStatus('Finalizing article structure...');
            const structuredData = parseStructuredText(finalizedContent);
            
            publishStatus('Enhanced content successfully');
            return {
                success: true,
                finalContent: JSON.stringify(structuredData),
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

    private async performInboundSecurity(agent: SecurityAgent, input: string, requestId: string, trace: any[]): Promise<string> {
        const start = performance.now();
        const res = await agent.validateInbound(input);
        const lat = Math.round(performance.now() - start);
        
        if (!res.success) throw new Error(res.error || 'Inbound security violation');
        
        const tokens = agent.estimateTokens(input, res.data);
        await governanceService.logAction({
            requestId,
            agentName: 'SecurityAgent',
            action: 'inbound_scan',
            inputSnapshot: input,
            outputSnapshot: res.data,
            latencyMs: lat,
            modelUsed: config.security.model,
            tokenUsage: tokens,
            cost: agent.calculateCost(tokens)
        });

        trace.push({ agent: 'SecurityAgent', status: 'inbound_complete' });
        return res.data;
    }

    private async performResearch(agent: DraftingAgent, topic: string, requestId: string, trace: any[]): Promise<string> {
        const start = performance.now();
        const res = await agent.research(topic);
        const lat = Math.round(performance.now() - start);
        
        const data = res.success ? res.data : '';
        const tokens = agent.estimateTokens(topic, data);
        await governanceService.logAction({
            requestId,
            agentName: 'DraftingAgent',
            action: 'research',
            inputSnapshot: topic,
            outputSnapshot: data,
            latencyMs: lat,
            modelUsed: 'sonar',
            tokenUsage: tokens,
            cost: agent.calculateCost(tokens)
        });

        trace.push({ agent: 'DraftingAgent', status: 'research_complete' });
        return data;
    }

    private async generateDraft(agent: DraftingAgent, options: any, requestId: string, trace: any[]): Promise<string> {
        const { mode, tone, sanitizedInput, targetPages, researchData, isTopic } = options;
        const start = performance.now();
        const res = await agent.draft({ mode, tone, text: sanitizedInput, targetPages, researchData, isTopic });
        const lat = Math.round(performance.now() - start);
        
        if (!res.success) throw new Error(res.error || 'Drafting failed');
        
        const tokens = agent.estimateTokens(sanitizedInput + researchData, res.data);
        await governanceService.logAction({
            requestId,
            agentName: 'DraftingAgent',
            action: 'drafting',
            inputSnapshot: sanitizedInput,
            outputSnapshot: res.data,
            latencyMs: lat,
            modelUsed: config.drafting.model,
            tokenUsage: tokens,
            cost: agent.calculateCost(tokens)
        });

        trace.push({ agent: 'DraftingAgent', status: 'drafting_complete' });
        return res.data;
    }

    private async runParallelIntelligence(vAgent: ValidationAgent, hAgent: HookAgent, content: string, research: string, tone: string, requestId: string, trace: any[]): Promise<{ audit: any, hooks: any }> {
        const start = performance.now();
        const [vRes, hRes] = await Promise.all([
            vAgent.validate(content, research),
            hAgent.refineHooks(content, tone)
        ]);
        const lat = Math.round(performance.now() - start);

        // Log Validation
        const vTokens = vAgent.estimateTokens(content + research, JSON.stringify(vRes.data));
        await governanceService.logAction({
            requestId, agentName: 'ValidationAgent', action: 'validation',
            inputSnapshot: content, outputSnapshot: JSON.stringify(vRes.data),
            latencyMs: lat, modelUsed: config.validation.model,
            tokenUsage: vTokens, cost: vAgent.calculateCost(vTokens)
        });

        // Log Hooks
        const hTokens = hAgent.estimateTokens(content, hRes.data);
        await governanceService.logAction({
            requestId, agentName: 'HookAgent', action: 'hook_refinement',
            inputSnapshot: content, outputSnapshot: hRes.data,
            latencyMs: lat, modelUsed: config.drafting.model,
            tokenUsage: hTokens, cost: hAgent.calculateCost(hTokens)
        });

        trace.push({ agent: 'ValidationAgent', status: 'parallel_validation_complete', data: vRes.data });
        trace.push({ agent: 'HookAgent', status: 'parallel_hook_refinement_complete' });
        
        return { audit: vRes.data, hooks: hRes.data };
    }

    private async refineContent(agent: RefiningAgent, content: string, audit: any, requestId: string, trace: any[]): Promise<string> {
        const start = performance.now();
        const res = await agent.refine(content, audit);
        const lat = Math.round(performance.now() - start);
        
        if (res.success) {
            const tokens = agent.estimateTokens(JSON.stringify(audit), res.data);
            await governanceService.logAction({
                requestId, agentName: 'RefiningAgent', action: 'refinement',
                inputSnapshot: JSON.stringify(audit), outputSnapshot: res.data,
                latencyMs: lat, modelUsed: config.refinement.model,
                tokenUsage: tokens, cost: agent.calculateCost(tokens)
            });
            trace.push({ agent: 'RefiningAgent', status: 'refinement_complete' });
            return res.data;
        }
        return content;
    }

    private async performOutboundSecurity(agent: SecurityAgent, content: string, requestId: string, trace: any[]): Promise<string> {
        const start = performance.now();
        const res = await agent.validateOutbound(content);
        const lat = Math.round(performance.now() - start);

        const tokens = agent.estimateTokens(content, res.data);
        await governanceService.logAction({
            requestId, agentName: 'SecurityAgent', action: 'outbound_scan',
            inputSnapshot: content, outputSnapshot: res.data,
            latencyMs: lat, modelUsed: config.security.model,
            tokenUsage: tokens, cost: agent.calculateCost(tokens)
        });
        
        return res.data;
    }
}
