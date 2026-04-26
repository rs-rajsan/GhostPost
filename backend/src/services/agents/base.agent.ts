import logger from '../../utils/logger';
import config from '../../config';

export interface AgentResponse<T = string> {
    success: boolean;
    data: T;
    metadata?: Record<string, any>;
    error?: string;
}

/**
 * BaseAgent provides standard patterns for all AI agents:
 * 1. Resilience (Retry Pattern)
 * 2. Observability (Context-Aware Child Logging)
 * 3. Security (Helicone/Proxy integration)
 */
export abstract class BaseAgent {
    protected name: string;
    protected requestId?: string;
    protected ctxLogger: any;

    constructor(name: string, requestId?: string) {
        this.name = name;
        this.requestId = requestId;
        
        // Centralized Tracing: Create a child logger that automatically 
        // includes the requestId and agent name in every log entry.
        this.ctxLogger = logger.child({ 
            agent: this.name,
            requestId: this.requestId 
        });
    }

    /**
     * Resilience Pattern: executes a task with exponential backoff retries.
     * Essential for dealing with transient 429/503 errors from AI providers.
     */
    protected async withRetry<T>(task: () => Promise<T>, maxRetries: number = 2): Promise<T> {
        let lastError: any;
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await task();
            } catch (error: any) {
                lastError = error;
                const isRetryable = error.status === 429 || error.status >= 500 || error.message.includes('timeout');
                
                if (i < maxRetries && isRetryable) {
                    const delay = Math.pow(2, i) * 1000;
                    this.ctxLogger.warn({ attempt: i + 1, delay, error: error.message }, 'Transient failure, retrying agent task...');
                    await new Promise(res => setTimeout(res, delay));
                    continue;
                }
                break;
            }
        }
        throw lastError;
    }

    protected getHeliconeHeaders(taskType?: string) {
        if (!config.helicone.enabled) return {};
        return {
            'Helicone-Auth': `Bearer ${config.helicone.apiKey}`,
            'Helicone-Property-Agent': this.name,
            ...(this.requestId && { 'Helicone-Property-Request-Id': this.requestId }),
            ...(taskType && { 'Helicone-Property-TaskType': taskType }),
        };
    }

    protected log(message: string, meta?: any) {
        this.ctxLogger.info(meta || {}, message);
    }

    protected logError(message: string, error?: any) {
        this.ctxLogger.error({ error: error?.message || error }, message);
    }

    /**
     * Governance: Estimates token usage based on conservative 4 chars/token heuristic.
     * Used for auditing and cost tracking in the absence of exact usage stats.
     */
    public estimateTokens(input: string, output: string): number {
        return Math.ceil((input.length + (output || '').length) / 4);
    }

    /**
     * Governance: Calculates cost based on GPT-4o-mini standard rates.
     */
    public calculateCost(tokens: number): number {
        return (tokens / 1000) * 0.0005;
    }
}
