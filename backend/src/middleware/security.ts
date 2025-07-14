import { Request, Response, NextFunction } from 'express';

// Security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

// Rate limiting middleware (fixed memory leak)
export const rateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  // Cleanup expired entries every 5 minutes to prevent memory leak
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  // Clean up interval on process exit
  process.on('SIGTERM', () => clearInterval(cleanupInterval));
  process.on('SIGINT', () => clearInterval(cleanupInterval));
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const userRequests = requests.get(ip);
    
    if (!userRequests || now > userRequests.resetTime) {
      // Clean up expired entry and create new one
      if (userRequests && now > userRequests.resetTime) {
        requests.delete(ip);
      }
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userRequests.count >= max) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Trop de requêtes, veuillez réessayer plus tard',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      });
    }
    
    userRequests.count++;
    return next();
  };
};

// CORS middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:19006',
    'https://reved-kids.com',
    'https://app.reved-kids.com'
  ];
  
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    if (res.statusCode >= 400) {
      console.error('Request Error:', logData);
    } else {
      console.log('Request:', logData);
    }
  });
  
  next();
};

// Trust proxy for accurate IP addresses
export const trustProxy = (req: Request, _res: Response, next: NextFunction) => {
  // Trust first proxy
  req.app.set('trust proxy', 1);
  next();
};

// Enhanced input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Enhanced input validation with JSON safety
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    return value;
  };

  // Validate JSON fields for SQL injection patterns
  const validateJSON = (value: any): boolean => {
    if (typeof value === 'object' && value !== null) {
      const jsonString = JSON.stringify(value).toLowerCase();
      const dangerousPatterns = ['drop', 'delete', 'insert', 'update', 'create', 'alter', 'truncate'];
      return !dangerousPatterns.some(pattern => jsonString.includes(pattern));
    }
    return true;
  };
  
  // Sanitize body
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      req.body[key] = sanitize(req.body[key]);
      
      // Additional validation for JSON fields
      if (typeof req.body[key] === 'object' && !validateJSON(req.body[key])) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Données JSON invalides détectées',
            code: 'INVALID_JSON_DATA'
          }
        });
      }
    }
  }
  
  // Sanitize query parameters
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitize(req.query[key]);
      }
    }
  }
  
  return next();
}; 