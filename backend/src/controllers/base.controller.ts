import { Request, Response } from 'express';

export abstract class BaseController {
  protected nomController: string = 'BaseController';

  protected repondreSucces(res: Response, data: any, message: string = 'Opération réussie'): void {
    res.status(200).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    });
  }

  protected repondreErreur(res: Response, message: string, statusCode: number = 500, code?: string): void {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        code: code || 'INTERNAL_ERROR'
      },
      timestamp: new Date().toISOString()
    });
  }

  protected repondreValidation(res: Response, errors: any[]): void {
    res.status(400).json({
      success: false,
      error: {
        message: 'Erreurs de validation',
        code: 'VALIDATION_ERROR',
        details: errors
      },
      timestamp: new Date().toISOString()
    });
  }

  protected log(message: string): void {
    console.log(`[${this.nomController}] ${message}`);
  }

  protected logError(message: string, error: any): void {
    console.error(`[${this.nomController}] ${message}:`, error);
  }

  protected logWarn(message: string): void {
    console.warn(`[${this.nomController}] ${message}`);
  }
} 