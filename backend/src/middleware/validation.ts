import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const handleValidationErrors = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));
    
    throw new AppError(
      'Erreurs de validation', 
      400, 
      'VALIDATION_ERROR'
    );
  }
  next();
};

// Student validation
export const validateStudent = [
  body('prenom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le prénom contient des caractères invalides'),
  
  body('nom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le nom contient des caractères invalides'),
  
  body('dateNaissance')
    .isISO8601()
    .withMessage('Date de naissance invalide (format: YYYY-MM-DD)')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 5 || age > 12) {
        throw new Error('L\'âge doit être entre 5 et 12 ans');
      }
      return true;
    }),
  
  body('niveauActuel')
    .isIn(['CP', 'CE1', 'CE2', 'CM1', 'CM2'])
    .withMessage('Niveau scolaire invalide'),
  
  body('emailParent')
    .optional()
    .isEmail()
    .withMessage('Email parent invalide')
    .normalizeEmail(),

  handleValidationErrors
];

// Exercise attempt validation
export const validateExerciseAttempt = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID élève invalide'),
  
  body('exerciceId')
    .isInt({ min: 1 })
    .withMessage('ID exercice invalide'),
  
  body('tentative')
    .isObject()
    .withMessage('Tentative requise'),
  
  body('tentative.reponse')
    .exists()
    .withMessage('Réponse requise'),
  
  body('tentative.reussi')
    .isBoolean()
    .withMessage('Statut de réussite requis'),
  
  body('tentative.tempsSecondes')
    .isInt({ min: 1, max: 3600 })
    .withMessage('Temps doit être entre 1 et 3600 secondes'),

  handleValidationErrors
];

// Security input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      Object.keys(obj).forEach(key => {
        sanitized[key] = sanitize(obj[key]);
      });
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
}; 