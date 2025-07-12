import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: number;
  userAgent?: string;
  ip?: string;
}

interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    load: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

interface ErrorMetrics {
  endpoint: string;
  error: string;
  stack?: string;
  timestamp: Date;
  userId?: number;
  userAgent?: string;
  ip?: string;
}

export class MonitoringService {
  private performanceMetrics: PerformanceMetrics[] = [];
  private errorMetrics: ErrorMetrics[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private dbQueries = 0;
  private slowQueries = 0;
  private startTime = Date.now();

  // Performance monitoring middleware
  performanceMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = performance.now();
      const originalSend = res.send;

      // Capture response
      res.send = function(body: any) {
        const end = performance.now();
        const responseTime = end - start;

        const metric: PerformanceMetrics = {
          endpoint: req.path,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          timestamp: new Date(),
          userId: (req as any).user?.id,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress
        };

        this.recordPerformanceMetric(metric);

        // Track slow requests (> 1 second)
        if (responseTime > 1000) {
          console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
        }

        return originalSend.call(this, body);
      }.bind(this);

      next();
    };
  };

  // Error monitoring middleware
  errorMiddleware = () => {
    return (error: any, req: Request, res: Response, next: NextFunction) => {
      const errorMetric: ErrorMetrics = {
        endpoint: req.path,
        error: error.message || 'Unknown error',
        stack: error.stack,
        timestamp: new Date(),
        userId: (req as any).user?.id,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      };

      this.recordErrorMetric(errorMetric);
      this.errorCount++;

      next(error);
    };
  };

  // Record performance metrics
  recordPerformanceMetric(metric: PerformanceMetrics): void {
    this.performanceMetrics.push(metric);
    this.requestCount++;

    // Keep only last 1000 metrics to prevent memory issues
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  // Record error metrics
  recordErrorMetric(metric: ErrorMetrics): void {
    this.errorMetrics.push(metric);

    // Keep only last 500 errors
    if (this.errorMetrics.length > 500) {
      this.errorMetrics = this.errorMetrics.slice(-500);
    }
  }

  // Track cache operations
  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  // Track database operations
  recordDbQuery(): void {
    this.dbQueries++;
  }

  recordSlowQuery(): void {
    this.slowQueries++;
  }

  // Get current system metrics
  getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100)
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000, // seconds
        load: require('os').loadavg()[0] || 0
      },
      database: {
        connections: 0, // Would need to track from connection pool
        queries: this.dbQueries,
        slowQueries: this.slowQueries
      },
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: this.cacheHits + this.cacheMisses > 0 
          ? Math.round((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100)
          : 0
      }
    };
  }

  // Get performance statistics
  getPerformanceStats(): any {
    const now = Date.now();
    const uptime = now - this.startTime;
    const recentMetrics = this.performanceMetrics.filter(
      m => now - m.timestamp.getTime() < 3600000 // Last hour
    );

    if (recentMetrics.length === 0) {
      return {
        uptime: Math.round(uptime / 1000),
        requestsPerSecond: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowRequestRate: 0
      };
    }

    const responseTimes = recentMetrics.map(m => m.responseTime);
    const errors = recentMetrics.filter(m => m.statusCode >= 400);
    const slowRequests = recentMetrics.filter(m => m.responseTime > 1000);

    return {
      uptime: Math.round(uptime / 1000),
      requestsPerSecond: Math.round(recentMetrics.length / 3600 * 100) / 100,
      averageResponseTime: Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      ),
      errorRate: Math.round((errors.length / recentMetrics.length) * 10000) / 100,
      slowRequestRate: Math.round((slowRequests.length / recentMetrics.length) * 10000) / 100,
      totalRequests: this.requestCount,
      totalErrors: this.errorCount
    };
  }

  // Get endpoint performance breakdown
  getEndpointStats(): any {
    const endpointStats: { [key: string]: any } = {};

    this.performanceMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      
      if (!endpointStats[key]) {
        endpointStats[key] = {
          count: 0,
          totalTime: 0,
          errors: 0,
          slowRequests: 0
        };
      }

      endpointStats[key].count++;
      endpointStats[key].totalTime += metric.responseTime;
      
      if (metric.statusCode >= 400) {
        endpointStats[key].errors++;
      }
      
      if (metric.responseTime > 1000) {
        endpointStats[key].slowRequests++;
      }
    });

    // Calculate averages and rates
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      stats.averageTime = Math.round(stats.totalTime / stats.count);
      stats.errorRate = Math.round((stats.errors / stats.count) * 10000) / 100;
      stats.slowRequestRate = Math.round((stats.slowRequests / stats.count) * 10000) / 100;
    });

    return endpointStats;
  }

  // Get recent errors
  getRecentErrors(limit: number = 10): ErrorMetrics[] {
    return this.errorMetrics
      .slice(-limit)
      .reverse();
  }

  // Get health status
  getHealthStatus(): any {
    const metrics = this.getSystemMetrics();
    const stats = this.getPerformanceStats();

    const isHealthy = 
      metrics.memory.percentage < 90 &&
      metrics.cpu.load < 5 &&
      stats.errorRate < 5 &&
      stats.averageResponseTime < 1000;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date(),
      checks: {
        memory: metrics.memory.percentage < 90,
        cpu: metrics.cpu.load < 5,
        errorRate: stats.errorRate < 5,
        responseTime: stats.averageResponseTime < 1000
      },
      metrics,
      stats
    };
  }

  // Generate performance report
  generateReport(): any {
    return {
      timestamp: new Date(),
      system: this.getSystemMetrics(),
      performance: this.getPerformanceStats(),
      endpoints: this.getEndpointStats(),
      recentErrors: this.getRecentErrors(5),
      health: this.getHealthStatus()
    };
  }

  // Reset metrics (useful for testing)
  resetMetrics(): void {
    this.performanceMetrics = [];
    this.errorMetrics = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.dbQueries = 0;
    this.slowQueries = 0;
    this.startTime = Date.now();
  }

  // Log performance alerts
  logPerformanceAlert(message: string, data: any): void {
    console.warn(`🚨 Performance Alert: ${message}`, data);
  }

  // Check for performance issues
  checkPerformanceIssues(): void {
    const metrics = this.getSystemMetrics();
    const stats = this.getPerformanceStats();

    // Memory usage alert
    if (metrics.memory.percentage > 85) {
      this.logPerformanceAlert('High memory usage', {
        percentage: metrics.memory.percentage,
        used: metrics.memory.used,
        total: metrics.memory.total
      });
    }

    // High error rate alert
    if (stats.errorRate > 10) {
      this.logPerformanceAlert('High error rate', {
        errorRate: stats.errorRate,
        totalErrors: stats.totalErrors
      });
    }

    // Slow response time alert
    if (stats.averageResponseTime > 2000) {
      this.logPerformanceAlert('Slow response times', {
        averageResponseTime: stats.averageResponseTime,
        slowRequestRate: stats.slowRequestRate
      });
    }

    // Low cache hit rate alert
    if (metrics.cache.hitRate < 50 && metrics.cache.hits + metrics.cache.misses > 100) {
      this.logPerformanceAlert('Low cache hit rate', {
        hitRate: metrics.cache.hitRate,
        hits: metrics.cache.hits,
        misses: metrics.cache.misses
      });
    }
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();

// Auto-check performance issues every 5 minutes
setInterval(() => {
  monitoringService.checkPerformanceIssues();
}, 5 * 60 * 1000); 