import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export interface ValidationErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details: ValidationError[];
  };
  timestamp: string;
}

/**
 * Middleware to handle validation errors from express-validator
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorResponse: ValidationErrorResponse = {
      success: false,
      error: {
        message: 'Erreurs de validation des données',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      },
      timestamp: new Date().toISOString()
    };

    res.status(400).json(errorResponse);
    return;
  }

  next();
};

/**
 * Custom validation middleware for JSON fields
 */
export const validateJSONField = (fieldName: string, allowedKeys?: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const fieldValue = req.body[fieldName];

    if (fieldValue !== undefined) {
      // Check if it's valid JSON
      if (typeof fieldValue !== 'object' || fieldValue === null) {
        return res.status(400).json({
          success: false,
          error: {
            message: `${fieldName} doit être un objet JSON valide`,
            code: 'INVALID_JSON_FIELD'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Check allowed keys if specified
      if (allowedKeys) {
        const invalidKeys = Object.keys(fieldValue).filter(key => !allowedKeys.includes(key));
        if (invalidKeys.length > 0) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Clés non autorisées dans ${fieldName}: ${invalidKeys.join(', ')}`,
              code: 'INVALID_JSON_KEYS'
            },
            timestamp: new Date().toISOString()
          });
        }
      }

      // Additional security check for dangerous content
      const jsonString = JSON.stringify(fieldValue).toLowerCase();
      const dangerousPatterns = ['<script', 'javascript:', 'eval(', 'function('];
      
      for (const pattern of dangerousPatterns) {
        if (jsonString.includes(pattern)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Contenu potentiellement dangereux détecté dans ${fieldName}`,
              code: 'DANGEROUS_CONTENT'
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return next();
  };
};

/**
 * Middleware to validate student ID exists
 */
export const validateStudentExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { Eleve } = await import('../models/eleve.model');
    const eleveId = req.params['eleveId'] || req.params['id'] || req.body['eleveId'];

    if (!eleveId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'ID élève requis',
          code: 'MISSING_STUDENT_ID'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const eleve = await Eleve.findByPk(eleveId);
    if (!eleve) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Élève non trouvé',
          code: 'STUDENT_NOT_FOUND'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Add student to request object for use in next middleware
    (req as any).student = eleve;
    return next();
  } catch (error) {
    console.error('Error validating student:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la validation de l\'élève',
        code: 'VALIDATION_ERROR'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to validate request size
 */
export const validateRequestSize = (maxSizeBytes: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        error: {
          message: 'Requête trop volumineuse',
          code: 'REQUEST_TOO_LARGE'
        },
        timestamp: new Date().toISOString()
      });
    }

    return next();
  };
};

/**
 * Middleware to validate content type
 */
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];
    
    if (req.method !== 'GET' && req.method !== 'DELETE' && contentType) {
      const isValidContentType = allowedTypes.some(type => 
        contentType.includes(type)
      );

      if (!isValidContentType) {
        return res.status(415).json({
          success: false,
          error: {
            message: `Type de contenu non supporté. Types acceptés: ${allowedTypes.join(', ')}`,
            code: 'UNSUPPORTED_CONTENT_TYPE'
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    return next();
  };
};

/**
 * Middleware to sanitize and validate specific field patterns
 */
export const validateFieldPatterns = (patterns: Record<string, RegExp>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const [fieldName, pattern] of Object.entries(patterns)) {
      const fieldValue = req.body[fieldName as keyof typeof req.body];
      
      if (fieldValue !== undefined && typeof fieldValue === 'string') {
        if (!pattern.test(fieldValue)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Format invalide pour le champ ${fieldName}`,
              code: 'INVALID_FIELD_FORMAT'
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return next();
  };
};

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneNumber: /^(?:\+33|0)[1-9](?:[0-9]{8})$/,
  postalCode: /^[0-9]{5}$/,
  studentName: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
  parentCode: /^[0-9]{6}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

/**
 * Validation middleware for student preferences
 */
export const validateStudentPreferences = validateJSONField('preferences', [
  'theme',
  'difficulty',
  'soundEnabled',
  'animationsEnabled',
  'language'
]);

/**
 * Validation middleware for student adaptations
 */
export const validateStudentAdaptations = validateJSONField('adaptations', [
  'dyslexia',
  'colorBlind',
  'hearing',
  'motor',
  'attention'
]);

/**
 * Rate limiting validation for specific endpoints
 */
export const validateRateLimit = (windowMs: number, maxRequests: number, keyGenerator?: (req: Request) => string) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(key);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : (req.ip || 'unknown');
    const now = Date.now();

    const userRequests = requests.get(key);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Trop de requêtes, veuillez réessayer plus tard',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        timestamp: new Date().toISOString()
      });
    }

    userRequests.count++;
    next();
  };
};

/**
 * Legacy validation functions for backward compatibility
 */
export const validateExerciseAttempt = [
  validateContentType(),
  validateRequestSize(),
  validateFieldPatterns({
    exerciceId: /^[0-9]+$/,
    'tentative.reponse': /^.+$/,
    'tentative.tempsSecondes': /^[0-9]+$/
  })
];

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  // Basic input sanitization
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        // Remove potential XSS content
        req.body[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      }
    }
  }
  next();
}; 