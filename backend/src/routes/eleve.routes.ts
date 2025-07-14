import { Router } from 'express';
import { EleveController } from '../controllers/eleve.controller';
import { validateExerciseAttempt, sanitizeInput } from '../middleware/validation';
import { rateLimiter } from '../middleware/security';
import { param, query, body } from 'express-validator';
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

// NEW ROUTES FOR ENHANCED FEATURES

// Update student preferences
router.put('/:id/preferences',
  rateLimiter(5 * 60 * 1000, 10), // 10 requests per 5 minutes
  validateStudentId,
  [
    body('preferences')
      .isObject()
      .withMessage('Préférences doit être un objet'),
    body('preferences.theme')
      .optional()
      .isIn(['light', 'dark', 'colorful', 'minimal'])
      .withMessage('Thème invalide'),
    body('preferences.difficulty')
      .optional()
      .isIn(['easy', 'normal', 'hard', 'adaptive'])
      .withMessage('Difficulté invalide'),
    body('preferences.soundEnabled')
      .optional()
      .isBoolean()
      .withMessage('SoundEnabled doit être un booléen'),
    body('preferences.animationsEnabled')
      .optional()
      .isBoolean()
      .withMessage('AnimationsEnabled doit être un booléen'),
    body('preferences.language')
      .optional()
      .isIn(['fr', 'en', 'es'])
      .withMessage('Langue invalide'),
    handleValidationErrors
  ],
  eleveController.updatePreferences
);

// Update student adaptations
router.put('/:id/adaptations',
  rateLimiter(5 * 60 * 1000, 10), // 10 requests per 5 minutes
  validateStudentId,
  [
    body('adaptations')
      .isObject()
      .withMessage('Adaptations doit être un objet'),
    body('adaptations.dyslexia')
      .optional()
      .isBoolean()
      .withMessage('Dyslexia doit être un booléen'),
    body('adaptations.colorBlind')
      .optional()
      .isBoolean()
      .withMessage('ColorBlind doit être un booléen'),
    body('adaptations.hearing')
      .optional()
      .isBoolean()
      .withMessage('Hearing doit être un booléen'),
    body('adaptations.motor')
      .optional()
      .isBoolean()
      .withMessage('Motor doit être un booléen'),
    body('adaptations.attention')
      .optional()
      .isBoolean()
      .withMessage('Attention doit être un booléen'),
    handleValidationErrors
  ],
  eleveController.updateAdaptations
);

// Get student statistics
router.get('/:id/statistiques',
  validateStudentId,
  eleveController.getStatistiques
);

// Update student login status
router.post('/:id/login',
  rateLimiter(1 * 60 * 1000, 5), // 5 login attempts per minute
  validateStudentId,
  eleveController.updateLoginStatus
);

// Logout student
router.post('/:id/logout',
  validateStudentId,
  eleveController.updateLogoutStatus
);

export { router as eleveRoutes }; 