import { prisma } from '../db';
import logger from '../utils/logger';

/**
 * GovernanceService handles auditing, cost tracking, and security logs.
 * Adheres to SOLID: Responsible ONLY for log persistence and maintenance.
 */
export class GovernanceService {
    /**
     * Records an agent interaction to Postgres.
     * Uses the Prisma ORM for type-safety and performance.
     */
    async logAction(data: {
        requestId: string;
        agentName: string;
        action: string;
        inputSnapshot: string;
        outputSnapshot: string;
        latencyMs: number;
        modelUsed: string;
        tokenUsage?: number;
        cost?: number;
        metadata?: any;
    }) {
        const { requestId, agentName } = data;

        try {
            // Using the ORM instance from the centralized singleton.
            // (prisma as any) is a temporary hint for the IDE until the TS Server refreshes,
            // but the underlying call is the standard, optimized Prisma 'create'.
            await (prisma as any).agentLog.create({
                data: {
                    ...data,
                    metadata: data.metadata || {}
                }
            });

            logger.debug({ requestId, agentName }, 'Governance audit entry saved');
        } catch (error: any) {
            // Non-blocking error handling to ensure content generation continues
            logger.error({ 
                requestId, 
                agentName, 
                error: error.message 
            }, 'Governance Logging Failure');
        }
    }

    /**
     * Maintenance: Rolling 7-day purge.
     * Keeps local disk usage lean.
     */
    async purgeOldLogs(days: number = 7) {
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            const result = await (prisma as any).agentLog.deleteMany({
                where: {
                    createdAt: {
                        lt: cutoff
                    }
                }
            });

            logger.info({ purgedCount: result.count, retentionDays: days }, 'Rolling Governance Maintenance Complete');
        } catch (error: any) {
            logger.error({ error: error.message }, 'Governance Purge Failure');
        }
    }
}

export const governanceService = new GovernanceService();
