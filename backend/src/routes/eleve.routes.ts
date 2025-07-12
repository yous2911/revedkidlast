import { Router } from 'express';
import { EleveController } from '../controllers/eleve.controller';
import { validateExerciseAttempt, sanitizeInput } from '../middleware/validation';
import { rateLimiter } from '../middleware/security';
import { param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const eleveController = new EleveController();

// Apply security middleware to all routes
router.use(rateLimiter(15 * 60 * 1000, 1000)); // 1000 requests per 15 minutes
router.use(sanitizeInput);

// Student ID validation middleware
const validateStudentId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID élève doit être un nombre entier positif')
    .toInt(),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page doit être un nombre entier positif')
    .toInt(),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite doit être entre 1 et 100')
    .toInt(),
  handleValidationErrors
];

// Get student basic info
router.get('/:id', 
  validateStudentId,
  eleveController.getEleve
);

// Get student recommended exercises
router.get('/:id/exercices-recommandes',
  validateStudentId,
  [
    query('limite')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limite doit être entre 1 et 20')
      .toInt(),
    handleValidationErrors
  ],
  eleveController.getExercicesRecommandes
);

// Submit exercise attempt
router.post('/:id/exercices/tentative',
  rateLimiter(1 * 60 * 1000, 60), // Special rate limiting for exercise submissions
  validateStudentId,
  validateExerciseAttempt,
  eleveController.soumettreExercice
);

// Get student progression with filtering
router.get('/:id/progression',
  validateStudentId,
  validatePagination,
  [
    query('statut')
      .optional()
      .isIn(['NON_COMMENCE', 'EN_COURS', 'TERMINE', 'MAITRISE'])
      .withMessage('Statut invalide'),
    query('matiere')
      .optional()
      .isIn(['MATHEMATIQUES', 'FRANCAIS', 'SCIENCES', 'HISTOIRE_GEOGRAPHIE', 'ANGLAIS'])
      .withMessage('Matière invalide'),
    handleValidationErrors
  ],
  eleveController.getProgression
);

// Get student sessions and analytics
router.get('/:id/sessions',
  validateStudentId,
  [
    query('jours')
      .optional()
      .isInt({ min: 1, max: 90 })
      .withMessage('Jours doit être entre 1 et 90')
      .toInt(),
    handleValidationErrors
  ],
  eleveController.getSessions
);

export { router as eleveRoutes }; 