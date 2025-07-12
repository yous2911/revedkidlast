import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { rateLimiter } from '../middleware/security';
import { Eleve } from '../models/eleve.model';

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

// Login route
router.post('/login', validateLogin, async (req, res) => {
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

    // Optional parent code verification for additional security
    if (parentCode) {
      // Simple 6-digit parent code verification
      // In production, this would be stored hashed in database
      const expectedCode = generateParentCode(eleve.id, eleve.dateNaissance);
      if (parentCode !== expectedCode) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Code parent incorrect',
            code: 'INVALID_PARENT_CODE'
          }
        });
      }
    }

    // Update last access
    await eleve.update({ 
      dernierAcces: new Date() 
    });

    // Log successful login
    console.log(`Connexion réussie - Élève: ${eleve.prenom} ${eleve.nom} (ID: ${eleve.id})`);
    
    res.json({
      success: true,
      data: {
        eleve: {
          id: eleve.id,
          prenom: eleve.prenom,
          nom: eleve.nom,
          niveauActuel: eleve.niveauActuel,
          age: eleve.age,
          totalPoints: eleve.totalPoints,
          serieJours: eleve.serieJours,
          preferences: eleve.preferences,
          adaptations: eleve.adaptations
        },
        session: {
          debut: new Date().toISOString(),
          expires: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
        }
      },
      message: 'Connexion réussie'
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la connexion',
        code: 'LOGIN_ERROR'
      }
    });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    const { eleveId } = req.body;
    
    if (eleveId) {
      const parsedEleveId = parseInt(eleveId);
      if (!isNaN(parsedEleveId) && parsedEleveId > 0) {
        try {
          await Eleve.update(
            { dernierAcces: new Date() },
            { where: { id: parsedEleveId } }
          );
          console.log(`Déconnexion - Élève ID: ${parsedEleveId}`);
        } catch (error) {
          // Don't fail logout if update fails
          console.warn('Erreur mise à jour dernière connexion:', error);
        }
      }
    }
    
    res.json({
      success: true,
      data: { 
        message: 'Déconnexion réussie',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur logout:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la déconnexion',
        code: 'LOGOUT_ERROR'
      }
    });
  }
});

// Verify student exists (for parent verification)
router.get('/verify/:eleveId', validateStudentVerification, async (req, res) => {
  try {
    const { eleveId } = req.params;
    
    if (!eleveId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'ID élève requis',
          code: 'MISSING_STUDENT_ID'
        }
      });
    }

    const eleve = await Eleve.findByPk(eleveId, {
      attributes: ['id', 'prenom', 'nom', 'niveauActuel', 'age', 'dernierAcces', 'dateNaissance']
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

    res.json({
      success: true,
      data: {
        exists: true,
        eleve: {
          id: eleve.id,
          prenom: eleve.prenom,
          nom: eleve.nom,
          niveau: eleve.niveauActuel,
          age: eleve.age,
          dernierAcces: eleve.dernierAcces,
          estConnecte: eleve.estConnecte
        },
        parentCode: generateParentCode(eleve.id, eleve.dateNaissance)
      },
      message: 'Élève vérifié'
    });
  } catch (error) {
    console.error('Erreur vérification élève:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la vérification',
        code: 'VERIFICATION_ERROR'
      }
    });
  }
});

// Health check for auth service
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const count = await Eleve.count();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        totalStudents: count,
        uptime: process.uptime()
      },
      message: 'Service d\'authentification opérationnel'
    });
  } catch (error) {
    console.error('Erreur health check auth:', error);
    res.status(503).json({
      success: false,
      error: {
        message: 'Service d\'authentification indisponible',
        code: 'SERVICE_UNAVAILABLE'
      }
    });
  }
});

// Generate simple parent code (for demo - use proper security in production)
function generateParentCode(eleveId: number, dateNaissance: Date): string {
  const date = dateNaissance.getDate().toString().padStart(2, '0');
  const month = (dateNaissance.getMonth() + 1).toString().padStart(2, '0');
  const id = eleveId.toString().padStart(2, '0').slice(-2);
  return `${date}${month}${id}`;
}

export { router as authRoutes }; 