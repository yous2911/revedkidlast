import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { globalErrorHandler } from './middleware/errorHandler';
import { 
  securityHeaders, 
  corsMiddleware, 
  requestLogger, 
  trustProxy,
  validateInput 
} from './middleware/security';
import { monitoringService } from './services/monitoring.service';
import { cacheMiddleware } from './services/cache.service';

// Import routes
import { authRoutes } from './routes/auth.routes';
import { eleveRoutes } from './routes/eleve.routes';
import monitoringRoutes from './routes/monitoring.routes';

const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.use(trustProxy);

// Security middleware
app.use(securityHeaders);

// CORS middleware
app.use(corsMiddleware);

// Compression for better performance
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress images or already compressed content
    const contentType = res.getHeader('content-type');
    if (typeof contentType === 'string') {
      return !contentType.includes('image/') && 
             !contentType.includes('video/') &&
             !contentType.includes('application/zip');
    }
    return true;
  }
}));

// Request parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Basic JSON bomb protection
    if (buf.length > 10 * 1024 * 1024) { // 10MB
      throw new Error('Payload trop volumineux');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring middleware
app.use(monitoringService.performanceMiddleware());

// Request logging and validation
app.use(requestLogger);
app.use(validateInput);

// Cache middleware for GET requests
app.use(cacheMiddleware(1800, 'api')); // 30 minutes cache

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/eleves', eleveRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RevEd Kids API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      students: '/api/eleves'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    },
    message: 'Service opérationnel'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint non trouvé',
      code: 'NOT_FOUND',
      path: req.originalUrl,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
});

// Error monitoring middleware
app.use(monitoringService.errorMiddleware());

// Global error handler (must be last)
app.use(globalErrorHandler);

export default app; 