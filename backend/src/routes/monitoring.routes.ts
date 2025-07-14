import { Router } from 'express';
import { monitoringService } from '../services/monitoring.service';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  try {
    const healthStatus = monitoringService.getHealthStatus();
    res.json({
      status: 'success',
      data: healthStatus,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get health status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Performance metrics endpoint
router.get('/performance', (_req, res) => {
  try {
    const performanceSummary = monitoringService.getPerformanceSummary();
    const systemMetrics = monitoringService.getSystemMetrics();
    
    res.json({
      status: 'success',
      data: {
        summary: performanceSummary,
        system: systemMetrics,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get performance metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Endpoint statistics
router.get('/endpoints', (_req, res) => {
  try {
    const endpointStats = monitoringService.getEndpointStats();
    
    res.json({
      status: 'success',
      data: {
        endpoints: endpointStats,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get endpoint statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Recent errors
router.get('/errors', (req, res) => {
  try {
    const limit = parseInt(req.query['limit'] as string) || 50;
    const recentErrors = monitoringService.getRecentErrors(limit);
    
    res.json({
      status: 'success',
      data: {
        errors: recentErrors,
        total: recentErrors.length,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get recent errors',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Active alerts
router.get('/alerts', (_req, res) => {
  try {
    const alerts = monitoringService.checkAlerts();
    
    res.json({
      status: 'success',
      data: {
        alerts,
        count: alerts.length,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// System metrics
router.get('/system', (_req, res) => {
  try {
    const systemMetrics = monitoringService.getSystemMetrics();
    
    res.json({
      status: 'success',
      data: {
        metrics: systemMetrics,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reset metrics (for testing/debugging)
router.post('/reset', (_req, res) => {
  try {
    monitoringService.reset();
    
    res.json({
      status: 'success',
      message: 'Metrics reset successfully',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Comprehensive monitoring dashboard data
router.get('/dashboard', (_req, res) => {
  try {
    const healthStatus = monitoringService.getHealthStatus();
    const performanceSummary = monitoringService.getPerformanceSummary();
    const systemMetrics = monitoringService.getSystemMetrics();
    const alerts = monitoringService.checkAlerts();
    const recentErrors = monitoringService.getRecentErrors(10);
    const endpointStats = monitoringService.getEndpointStats().slice(0, 10); // Top 10 slowest endpoints
    
    res.json({
      status: 'success',
      data: {
        health: healthStatus,
        performance: performanceSummary,
        system: systemMetrics,
        alerts,
        recentErrors,
        topEndpoints: endpointStats,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 