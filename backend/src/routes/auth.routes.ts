import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { rateLimiter } from '../middleware/security';
import { Eleve } from '../models/eleve.model';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = Router();

// Apply strict rate limiting to auth routes
router.use(rateLimiter(15 * 60 * 1000, 10)); // 10 auth requests per 15 minutes

// Login validation
const validateLogin = [
  body('eleveId')
    .isInt({ min: 1 })
    .withMessage('ID élève requis et doit être un nombre positif')
    .toInt(),
  body('parentCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Code parent doit contenir exactement 6 caractères')
    .isNumeric()
    .withMessage('Code parent doit être numérique'),
  handleValidationErrors
];

// Student verification validation
const validateStudentVerification = [
  param('eleveId')
    .isInt({ min: 1 })
    .withMessage('ID élève invalide')
    .toInt(),
  handleValidationErrors
];

// FIXED: Complete authentication logic
router.post('/login', validateLogin, async (req: Request, res: Response) => {
  try {
    const { eleveId, parentCode } = req.body;
    
    if (!eleveId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'ID élève requis',
          code: 'MISSING_STUDENT_ID'
        }
      });
    }

    const eleve = await Eleve.findByPk(eleveId);
    if (!eleve) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Élève non trouvé',
          code: 'STUDENT_NOT_FOUND'
        }
      });
    }

    // FIXED: Complete parent code verification
    if (parentCode) {
      // Generate expected parent code based on student data
      const expectedParentCode = generateParentCode(eleve);
      
      if (parentCode !== expectedParentCode) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Code parent incorrect',
            code: 'INVALID_PARENT_CODE'
          }
        });
      }
    }

    // Update last access time
    await eleve.update({
      dernierAcces: new Date(),
      estConnecte: true
    });

    // Generate JWT token
    const token = generateJWTToken(eleve);

    return res.json({
      success: true,
      data: {
        eleve: {
          id: eleve.id,
          prenom: eleve.prenom,
          nom: eleve.nom,
          niveauActuel: eleve.niveauActuel,
          totalPoints: eleve.totalPoints,
          serieJours: eleve.serieJours
        },
        token,
        expiresIn: '24h'
      },
      message: 'Connexion réussie'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la connexion',
        code: 'LOGIN_ERROR'
      }
    });
  }
});

// Logout route
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { eleveId } = req.body;

    if (eleveId) {
      const eleve = await Eleve.findByPk(eleveId);
      if (eleve) {
        await eleve.update({ estConnecte: false });
      }
    }

    return res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la déconnexion',
        code: 'LOGOUT_ERROR'
      }
    });
  }
});

// Student verification route
router.get('/verify/:eleveId', validateStudentVerification, async (req: Request, res: Response) => {
  try {
    const { eleveId } = req.params;

    const eleve = await Eleve.findByPk(eleveId, {
      attributes: ['id', 'prenom', 'nom', 'niveauActuel', 'totalPoints', 'serieJours', 'estConnecte']
    });

    if (!eleve) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Élève non trouvé',
          code: 'STUDENT_NOT_FOUND'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        eleve: {
          id: eleve.id,
          prenom: eleve.prenom,
          nom: eleve.nom,
          niveauActuel: eleve.niveauActuel,
          totalPoints: eleve.totalPoints,
          serieJours: eleve.serieJours,
          estConnecte: eleve.estConnecte
        }
      },
      message: 'Élève vérifié'
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la vérification',
        code: 'VERIFICATION_ERROR'
      }
    });
  }
});

// Auth health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'authentication',
      timestamp: new Date().toISOString()
    },
    message: 'Service d\'authentification opérationnel'
  });
});

// Helper function to generate parent code
function generateParentCode(eleve: Eleve): string {
  // Simple parent code generation based on student data
  // You can implement your own logic here
  const baseString = `${eleve.prenom}${eleve.nom}${eleve.dateNaissance.getFullYear()}`;
  const hash = bcrypt.hashSync(baseString, 10);
  
  // Extract 6 digits from hash
  const digits = hash.replace(/\D/g, '').substring(0, 6);
  return digits.padEnd(6, '0');
}

// Helper function to generate JWT token
function generateJWTToken(eleve: Eleve): string {
  const secretKey = process.env['JWT_SECRET'] || 'your-secret-key-change-in-production';
  
  return jwt.sign(
    {
      id: eleve.id,
      prenom: eleve.prenom,
      niveauActuel: eleve.niveauActuel,
      type: 'student'
    },
    secretKey,
    { 
      expiresIn: '24h',
      issuer: 'reved-kids-backend',
      audience: 'reved-kids-app'
    }
  );
}

// Middleware to verify JWT token
export const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token d\'authentification requis',
        code: 'TOKEN_REQUIRED'
      }
    });
  }

  try {
    const secretKey = process.env['JWT_SECRET'] || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token d\'authentification invalide',
        code: 'INVALID_TOKEN'
      }
    });
  }
};

export { router as authRoutes }; 