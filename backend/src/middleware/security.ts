import { Request, Response, NextFunction } from 'express';

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
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

// Rate limiting middleware (simplified)
export const rateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const userRequests = requests.get(ip);
    
    if (!userRequests || now > userRequests.resetTime) {
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
    next();
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
  
  next();
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
export const trustProxy = (req: Request, res: Response, next: NextFunction) => {
  // Trust first proxy
  req.app.set('trust proxy', 1);
  next();
};

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic input validation
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
  
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      req.body[key] = sanitize(req.body[key]);
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitize(req.query[key]);
      }
    });
  }
  
  next();
}; 