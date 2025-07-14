import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public isOperational: boolean = true;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    if (code) {
      this.code = code;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = err;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Convert known errors
  if (err.name === 'ValidationError') {
    const message = 'Erreur de validation des données';
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    error = new AppError('Cette ressource existe déjà', 409, 'DUPLICATE_ENTRY');
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = new AppError('Référence invalide', 400, 'INVALID_REFERENCE');
  }

  // Default error response
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = process.env['NODE_ENV'] === 'production' && statusCode >= 500 
    ? 'Erreur interne du serveur' 
    : error.message;

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      ...(error instanceof AppError && error.code && { code: error.code }),
      ...(process.env['NODE_ENV'] !== 'production' && { details: err.stack })
    },
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 