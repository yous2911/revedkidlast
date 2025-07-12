import { Router } from 'express';
import { monitoringService } from '../services/monitoring.service';
import { cacheService } from '../services/cache.service';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
  const health = monitoringService.getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    success: true,
    data: health,
    message: `Service is ${health.status}`
  });
}));

// Performance metrics
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = monitoringService.generateReport();
  
  res.json({
    success: true,
    data: metrics,
    message: 'Performance metrics retrieved successfully'
  });
}));

// System metrics
router.get('/system', asyncHandler(async (req, res) => {
  const systemMetrics = monitoringService.getSystemMetrics();
  
  res.json({
    success: true,
    data: systemMetrics,
    message: 'System metrics retrieved successfully'
  });
}));

// Performance statistics
router.get('/performance', asyncHandler(async (req, res) => {
  const performanceStats = monitoringService.getPerformanceStats();
  
  res.json({
    success: true,
    data: performanceStats,
    message: 'Performance statistics retrieved successfully'
  });
}));

// Endpoint statistics
router.get('/endpoints', asyncHandler(async (req, res) => {
  const endpointStats = monitoringService.getEndpointStats();
  
  res.json({
    success: true,
    data: endpointStats,
    message: 'Endpoint statistics retrieved successfully'
  });
}));

// Recent errors
router.get('/errors', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const recentErrors = monitoringService.getRecentErrors(limit);
  
  res.json({
    success: true,
    data: recentErrors,
    message: 'Recent errors retrieved successfully'
  });
}));

// Cache statistics
router.get('/cache', asyncHandler(async (req, res) => {
  const cacheStats = await cacheService.getCacheStats();
  
  res.json({
    success: true,
    data: cacheStats,
    message: 'Cache statistics retrieved successfully'
  });
}));

// Clear cache
router.delete('/cache', asyncHandler(async (req, res) => {
  const pattern = req.query.pattern as string || '*';
  const deletedCount = await cacheService.invalidatePattern(pattern);
  
  res.json({
    success: true,
    data: { deletedCount, pattern },
    message: `Cache cleared successfully. ${deletedCount} entries deleted.`
  });
}));

// Reset monitoring metrics
router.post('/reset', asyncHandler(async (req, res) => {
  monitoringService.resetMetrics();
  
  res.json({
    success: true,
    data: null,
    message: 'Monitoring metrics reset successfully'
  });
}));

// Performance alerts
router.get('/alerts', asyncHandler(async (req, res) => {
  // Check for current performance issues
  monitoringService.checkPerformanceIssues();
  
  const health = monitoringService.getHealthStatus();
  const alerts = [];
  
  if (health.status === 'degraded') {
    alerts.push({
      type: 'performance',
      severity: 'warning',
      message: 'System performance is degraded',
      details: health.checks
    });
  }
  
  const metrics = monitoringService.getSystemMetrics();
  if (metrics.memory.percentage > 85) {
    alerts.push({
      type: 'memory',
      severity: 'warning',
      message: 'High memory usage detected',
      details: metrics.memory
    });
  }
  
  if (metrics.cache.hitRate < 50 && metrics.cache.hits + metrics.cache.misses > 100) {
    alerts.push({
      type: 'cache',
      severity: 'info',
      message: 'Low cache hit rate detected',
      details: metrics.cache
    });
  }
  
  res.json({
    success: true,
    data: alerts,
    message: 'Performance alerts retrieved successfully'
  });
}));

export default router; 