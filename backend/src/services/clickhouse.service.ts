import axios from 'axios';
import logger from '../utils/logger';
import config from '../config';

const CLICKHOUSE_URL = config.clickhouse.url;

export interface HeliconeMetric {
  total_requests: number;
  avg_latency: number;
  total_tokens: number;
  total_cost: number;
  success_rate: number;
}

export const clickhouseService = {
  /**
   * Execute a raw SQL query against Clickhouse
   */
  async query<T>(sql: string): Promise<T[]> {
    const start = Date.now();
    try {
      const response = await axios.post(CLICKHOUSE_URL, sql, {
        params: {
          default_format: 'JSON'
        },
        timeout: config.clickhouse.timeout
      });
      
      const duration = Date.now() - start;
      logger.info({ sql, duration: `${duration}ms` }, 'Clickhouse query successful');
      
      return response.data.data as T[];
    } catch (error: any) {
      const duration = Date.now() - start;
      
      // If table doesn't exist yet (no requests made), return empty gracefully
      if (error.response?.data?.includes('Table helicone.request_response_logs does not exist')) {
        logger.warn({ sql, duration: `${duration}ms` }, 'Clickhouse table not found - returning empty');
        return [];
      }
      
      logger.error({ 
        error: error.message, 
        sql, 
        duration: `${duration}ms`,
        response: error.response?.data 
      }, 'Clickhouse query failed');
      
      return [];
    }
  },

  /**
   * Fetch high-level KPIs
   */
  async getKpis() {
    const sql = `
      SELECT 
        count() as total_requests,
        round(avg(latency), 2) as avg_latency,
        sum(prompt_tokens + completion_tokens) as total_tokens,
        round(sum(cost), 4) as total_cost,
        round(countIf(status = 200) * 100.0 / count(), 1) as success_rate
      FROM helicone.request_response_logs
    `;
    const results = await this.query<any>(sql);
    return results[0] || {
      total_requests: 0,
      avg_latency: 0,
      total_tokens: 0,
      total_cost: 0,
      success_rate: 100
    };
  },

  /**
   * Fetch volume data for charts (last 24 hours by hour)
   */
  async getVolumeData() {
    const sql = `
      SELECT 
        toStartOfHour(request_created_at) as hour,
        count() as count
      FROM helicone.request_response_logs
      WHERE request_created_at > now() - INTERVAL 24 HOUR
      GROUP BY hour
      ORDER BY hour ASC
    `;
    return this.query<{ hour: string; count: number }>(sql);
  },

  /**
   * Fetch model distribution
   */
  async getModelDistribution() {
    const sql = `
      SELECT 
        model,
        count() as count,
        round(count() * 100.0 / (SELECT count() FROM helicone.request_response_logs), 1) as percentage
      FROM helicone.request_response_logs
      GROUP BY model
      ORDER BY count DESC
    `;
    return this.query<{ model: string; count: number; percentage: number }>(sql);
  },

  /**
   * Fetch recent request logs
   */
  async getRecentLogs(limit = 10) {
    const sql = `
      SELECT 
        request_id as id,
        model,
        prompt_tokens + completion_tokens as tokens,
        round(cost, 4) as cost,
        status,
        request_created_at as time
      FROM helicone.request_response_logs
      ORDER BY request_created_at DESC
      LIMIT ${limit}
    `;
    return this.query<any>(sql);
  }
};
