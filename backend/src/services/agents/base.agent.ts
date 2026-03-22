import logger from '../../utils/logger';
import config from '../../config';

export interface AgentResponse<T = string> {
    success: boolean;
    data: T;
    metadata?: Record<string, any>;
    error?: string;
}

export abstract class BaseAgent {
    protected name: string;

    constructor(name: string) {
        this.name = name;
    }

    protected getHeliconeHeaders(taskType?: string) {
        if (!config.helicone.enabled) return {};

        return {
            'Helicone-Auth': `Bearer ${config.helicone.apiKey}`,
            'Helicone-Property-Agent': this.name,
            ...(taskType && { 'Helicone-Property-TaskType': taskType }),
        };
    }

    public getName(): string {
        return this.name;
    }

    protected log(message: string, meta?: any) {
        logger.info({ agent: this.name, ...meta }, message);
    }

    protected logError(message: string, error?: any) {
        logger.error({ agent: this.name, error: error?.message || error }, message);
    }
}
