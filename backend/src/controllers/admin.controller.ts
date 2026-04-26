import { Request, Response } from 'express';
import { clickhouseService } from '../services/clickhouse.service';
import logger from '../utils/logger';

export const adminController = {
  /**
   * Get all dashboard metrics in a single call
   */
  async getDashboardMetrics(req: Request, res: Response) {
    try {
      const [kpis, volume, models, logs] = await Promise.all([
        clickhouseService.getKpis(),
        clickhouseService.getVolumeData(),
        clickhouseService.getModelDistribution(),
        clickhouseService.getRecentLogs(10)
      ]);

      res.status(200).json({
        kpis,
        volume,
        models,
        logs
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch dashboard metrics');
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  }
};
