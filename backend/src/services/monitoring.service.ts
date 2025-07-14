import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userId?: number;
  userAgent?: string | undefined;
  ip?: string | undefined;
}

interface ErrorMetrics {
  endpoint: string;
  error: string;
  stack?: string;
  timestamp: Date;
  userId?: number;
  userAgent?: string | undefined;
  ip?: string | undefined;
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

interface AlertRule {
  name: string;
  condition: (metrics: SystemMetrics) => boolean;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class MonitoringService {
  // FIXED: Use circular buffer instead of array for better performance
  private performanceMetrics: PerformanceMetrics[] = [];
  private errorMetrics: ErrorMetrics[] = [];
  private currentIndex: number = 0;
  private maxMetrics: number = 1000;
  private maxErrors: number = 500;

  // Counters
  private requestCount: number = 0;
  private errorCount: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private dbQueries: number = 0;
  private slowQueries: number = 0;

  // Alert rules
  private alertRules: AlertRule[] = [
    {
      name: 'High Memory Usage',
      condition: (metrics) => metrics.memory.percentage > 85,
      message: 'Memory usage is above 85%',
      severity: 'high'
    },
    {
      name: 'High Error Rate',
      condition: () => this.getErrorRate() > 0.05, // 5% error rate
      message: 'Error rate is above 5%',
      severity: 'high'
    },
    {
      name: 'Low Cache Hit Rate',
      condition: (metrics) => metrics.cache.hitRate < 0.7, // 70% hit rate
      message: 'Cache hit rate is below 70%',
      severity: 'medium'
    },
    {
      name: 'Too Many Slow Queries',
      condition: (metrics) => metrics.database.slowQueries > 10,
      message: 'More than 10 slow database queries detected',
      severity: 'medium'
    }
  ];

  // FIXED: Circular buffer implementation for performance metrics
  recordPerformanceMetric(metric: PerformanceMetrics): void {
    if (this.performanceMetrics.length < this.maxMetrics) {
      this.performanceMetrics.push(metric);
    } else {
      // Replace oldest entry in circular buffer
      this.performanceMetrics[this.currentIndex % this.maxMetrics] = metric;
      this.currentIndex++;
    }
    this.requestCount++;
  }

  // FIXED: Circular buffer for error metrics
  recordErrorMetric(metric: ErrorMetrics): void {
    if (this.errorMetrics.length < this.maxErrors) {
      this.errorMetrics.push(metric);
    } else {
      // Replace oldest entry in circular buffer
      const errorIndex = this.errorCount % this.maxErrors;
      this.errorMetrics[errorIndex] = metric;
    }
    this.errorCount++;
  }

  // Performance monitoring middleware
  performanceMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      // Override res.end to capture response time
      const originalSend = res.send;
      res.send = function(this: Response, body: any) {
        const responseTime = Date.now() - startTime;
        
        const metric: PerformanceMetrics = {
          endpoint: req.path,
          method: req.method,
          duration: responseTime,
          statusCode: res.statusCode,
          timestamp: new Date(),
          userId: (req as any).user?.id,
          userAgent: req.get('User-Agent') || undefined,
          ip: req.ip || req.connection.remoteAddress || undefined
        };

        // Use singleton instance to record metric
        monitoringService.recordPerformanceMetric(metric);

        // Log slow requests (> 1 second)
        if (responseTime > 1000) {
          console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
        }

        return originalSend.call(this, body);
      };

      next();
    };
  };

  // Error monitoring middleware
  errorMiddleware = () => {
    return (error: any, req: Request, _res: Response, next: NextFunction) => {
      const errorMetric: ErrorMetrics = {
        endpoint: req.path,
        error: error.message || 'Unknown error',
        stack: error.stack,
        timestamp: new Date(),
        userId: (req as any).user?.id,
        userAgent: req.get('User-Agent') || undefined,
        ip: req.ip || req.connection.remoteAddress || undefined
      };

      this.recordErrorMetric(errorMetric);

      next(error);
    };
  };

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
    const os = require('os');
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100)
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000, // seconds
        load: os.loadavg()[0] || 0
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
          ? this.cacheHits / (this.cacheHits + this.cacheMisses)
          : 0
      }
    };
  }

  // Get performance summary
  getPerformanceSummary() {
    if (this.performanceMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowestEndpoint: null,
        fastestEndpoint: null,
        errorRate: 0
      };
    }

    const durations = this.performanceMetrics.map(m => m.duration);
    const averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    const slowestRequest = this.performanceMetrics.reduce((prev, current) => 
      (prev.duration > current.duration) ? prev : current
    );
    
    const fastestRequest = this.performanceMetrics.reduce((prev, current) => 
      (prev.duration < current.duration) ? prev : current
    );

    return {
      totalRequests: this.requestCount,
      averageResponseTime: Math.round(averageResponseTime),
      slowestEndpoint: {
        endpoint: `${slowestRequest.method} ${slowestRequest.endpoint}`,
        duration: slowestRequest.duration
      },
      fastestEndpoint: {
        endpoint: `${fastestRequest.method} ${fastestRequest.endpoint}`,
        duration: fastestRequest.duration
      },
      errorRate: this.getErrorRate()
    };
  }

  // Get error rate
  private getErrorRate(): number {
    if (this.requestCount === 0) return 0;
    return this.errorCount / this.requestCount;
  }

  // Get recent errors (last 50)
  getRecentErrors(limit: number = 50) {
    const recentErrors = this.errorMetrics
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return recentErrors.map(error => ({
      endpoint: error.endpoint,
      error: error.error,
      timestamp: error.timestamp,
      userId: error.userId,
      userAgent: error.userAgent
    }));
  }

  // Check alerts
  checkAlerts(): any[] {
    const systemMetrics = this.getSystemMetrics();
    const activeAlerts: any[] = [];

    for (const rule of this.alertRules) {
      if (rule.condition(systemMetrics)) {
        activeAlerts.push({
          name: rule.name,
          message: rule.message,
          severity: rule.severity,
          timestamp: new Date(),
          metrics: systemMetrics
        });
      }
    }

    return activeAlerts;
  }

  // Get endpoint statistics
  getEndpointStats() {
    const endpointStats = new Map<string, {
      count: number;
      totalDuration: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
      errorCount: number;
    }>();

    // Process performance metrics
    this.performanceMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorCount: 0
      };

      existing.count++;
      existing.totalDuration += metric.duration;
      existing.minDuration = Math.min(existing.minDuration, metric.duration);
      existing.maxDuration = Math.max(existing.maxDuration, metric.duration);
      existing.averageDuration = existing.totalDuration / existing.count;
      
      if (metric.statusCode >= 400) {
        existing.errorCount++;
      }

      endpointStats.set(key, existing);
    });

    // Convert to array and sort by average duration
    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        ...stats,
        errorRate: stats.count > 0 ? stats.errorCount / stats.count : 0
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration);
  }

  // Reset all metrics (useful for testing)
  reset(): void {
    this.performanceMetrics = [];
    this.errorMetrics = [];
    this.currentIndex = 0;
    this.requestCount = 0;
    this.errorCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.dbQueries = 0;
    this.slowQueries = 0;
  }

  // Get health status
  getHealthStatus(): { status: string; checks: any[] } {
    const alerts = this.checkAlerts();
    const systemMetrics = this.getSystemMetrics();
    
    const checks = [
      {
        name: 'Memory Usage',
        status: systemMetrics.memory.percentage < 85 ? 'healthy' : 'unhealthy',
        value: `${systemMetrics.memory.percentage}%`
      },
      {
        name: 'Error Rate',
        status: this.getErrorRate() < 0.05 ? 'healthy' : 'unhealthy',
        value: `${(this.getErrorRate() * 100).toFixed(2)}%`
      },
      {
        name: 'Cache Hit Rate',
        status: systemMetrics.cache.hitRate > 0.7 ? 'healthy' : 'warning',
        value: `${(systemMetrics.cache.hitRate * 100).toFixed(2)}%`
      }
    ];

    const overallStatus = alerts.some(alert => alert.severity === 'critical') ? 'critical' :
                         alerts.some(alert => alert.severity === 'high') ? 'unhealthy' :
                         alerts.some(alert => alert.severity === 'medium') ? 'warning' : 'healthy';

    return {
      status: overallStatus,
      checks
    };
  }
}

// Create singleton instance
export const monitoringService = new MonitoringService(); 