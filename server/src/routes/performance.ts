import { Router, Request, Response } from 'express';
import { readPerfLogs, clearPerfLogs } from '../services/logger.js';

const router = Router();

// Helper to calculate percentiles
function getPercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)] * 100) / 100;
}

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const logs = await readPerfLogs();

    // Group durations by operation/route
    const routeDurations: Record<string, number[]> = {};
    const dbDurations: Record<string, number[]> = {};
    const serviceDurations: Record<string, number[]> = {};

    let healthyCount = 0;
    let slowCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    let slowQueriesCount = 0;
    let monitorQueriesCount = 0;
    let investigateQueriesCount = 0;

    const rawDbQueries: any[] = [];

    for (const log of logs) {
      const duration = log.durationMs;

      if (log.stage === 'Express') {
        const route = log.operation;
        if (!routeDurations[route]) {
          routeDurations[route] = [];
        }
        routeDurations[route].push(duration);

        // Threshold counts
        if (duration < 300) {
          healthyCount++;
        } else if (duration >= 300 && duration < 500) {
          slowCount++;
        } else if (duration >= 500 && duration <= 1000) {
          warningCount++;
        } else {
          criticalCount++;
        }
      } else if (log.stage === 'Database') {
        const op = log.operation;
        if (!dbDurations[op]) {
          dbDurations[op] = [];
        }
        dbDurations[op].push(duration);

        // SQL Query Classifications
        const qStatus = log.metadata?.queryStatus;
        if (qStatus === 'Investigate' || duration > 100) {
          investigateQueriesCount++;
        } else if (qStatus === 'Slow' || duration > 50) {
          slowQueriesCount++;
        } else if (qStatus === 'Monitor' || duration > 20) {
          monitorQueriesCount++;
        }

        rawDbQueries.push({
          operation: op,
          durationMs: duration,
          timestamp: log.timestamp,
          requestId: log.requestId,
          rows: log.metadata?.rows || 0,
        });
      } else if (log.stage === 'Service') {
        const op = log.operation;
        if (!serviceDurations[op]) {
          serviceDurations[op] = [];
        }
        serviceDurations[op].push(duration);
      }
    }

    // Format route stats with percentiles
    const avgRouteLatency = Object.entries(routeDurations).map(([route, durs]) => {
      const sum = durs.reduce((s, v) => s + v, 0);
      return {
        route,
        count: durs.length,
        avgDurationMs: Math.round((sum / durs.length) * 100) / 100,
        p50: getPercentile(durs, 50),
        p95: getPercentile(durs, 95),
        p99: getPercentile(durs, 99),
      };
    }).sort((a, b) => b.avgDurationMs - a.avgDurationMs);

    // Format service execution stats with percentiles
    const serviceCounts = Object.entries(serviceDurations).map(([method, durs]) => {
      const sum = durs.reduce((s, v) => s + v, 0);
      return {
        method,
        count: durs.length,
        avgDurationMs: Math.round((sum / durs.length) * 100) / 100,
        p50: getPercentile(durs, 50),
        p95: getPercentile(durs, 95),
        p99: getPercentile(durs, 99),
      };
    }).sort((a, b) => b.count - a.count);

    // Format slowest database queries (top 10)
    const slowestDbQueries = rawDbQueries
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 10);

    // Aggregated database stats
    const dbStats = Object.entries(dbDurations).map(([op, durs]) => {
      const sum = durs.reduce((s, v) => s + v, 0);
      return {
        operation: op,
        count: durs.length,
        avgDurationMs: Math.round((sum / durs.length) * 100) / 100,
        p50: getPercentile(durs, 50),
        p95: getPercentile(durs, 95),
        p99: getPercentile(durs, 99),
      };
    }).sort((a, b) => b.avgDurationMs - a.avgDurationMs);

    res.json({
      summary: {
        totalRequests: avgRouteLatency.reduce((sum, r) => sum + r.count, 0),
        thresholds: {
          healthy: healthyCount,
          slow: slowCount,
          warning: warningCount,
          critical: criticalCount,
        },
        database: {
          totalQueries: rawDbQueries.length,
          monitorQueries: monitorQueriesCount,
          slowQueries: slowQueriesCount,
          investigateQueries: investigateQueriesCount,
        }
      },
      avgRouteLatency,
      slowestDbQueries,
      dbStats,
      serviceCounts,
    });
  } catch (error) {
    console.error('Error generating performance summary:', error);
    res.status(500).json({ error: 'Failed to generate performance summary' });
  }
});

// DELETE /performance/clear - clear all performance logs
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    await clearPerfLogs();
    res.json({ status: 'cleared' });
  } catch (error) {
    console.error('Error clearing performance logs:', error);
    res.status(500).json({ error: 'Failed to clear performance logs' });
  }
});

export default router;
