import express from 'express';
import { MathsGenerator } from '../lib/mathsGenerator';

const router = express.Router();
const mathsGenerator = new MathsGenerator();

// GET /api/maths/defis - Obtenir tous les défis mathématiques
router.get('/defis', (_req, res) => {
  try {
    const defis = mathsGenerator.getAllDefis();
    res.json({
      success: true,
      data: defis,
      count: defis.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des défis maths:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/maths/defis/:id - Obtenir un défi spécifique
router.get('/defis/:id', (req, res) => {
  try {
    const { id } = req.params;
    const defi = mathsGenerator.getDefiById(id);
    
    if (!defi) {
      return res.status(404).json({
        success: false,
        error: 'Défi non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: defi
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du défi maths:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/maths/defis/niveau/:niveau - Obtenir des défis par niveau
router.get('/defis/niveau/:niveau', (req, res) => {
  try {
    const niveau = parseInt(req.params.niveau);
    
    if (isNaN(niveau) || niveau < 1 || niveau > 5) {
      return res.status(400).json({
        success: false,
        error: 'Niveau invalide (doit être entre 1 et 5)'
      });
    }
    
    const defis = mathsGenerator.getDefisByNiveau(niveau);
    res.json({
      success: true,
      data: defis,
      count: defis.length,
      niveau
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des défis par niveau:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/maths/defis/type/:type - Obtenir des défis par type
router.get('/defis/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    const typesValides = ['decomposition', 'complement', 'addition', 'soustraction', 'comparaison'];
    
    if (!typesValides.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type invalide',
        typesValides
      });
    }
    
    const defis = mathsGenerator.getDefisByType(type as any);
    res.json({
      success: true,
      data: defis,
      count: defis.length,
      type
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des défis par type:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/maths/defis/difficulte/:difficulte - Obtenir des défis par difficulté
router.get('/defis/difficulte/:difficulte', (req, res) => {
  try {
    const { difficulte } = req.params;
    const difficultesValides = ['facile', 'moyen', 'difficile'];
    
    if (!difficultesValides.includes(difficulte)) {
      return res.status(400).json({
        success: false,
        error: 'Difficulté invalide',
        difficultesValides
      });
    }
    
    const defis = mathsGenerator.getDefisByDifficulte(difficulte as any);
    res.json({
      success: true,
      data: defis,
      count: defis.length,
      difficulte
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des défis par difficulté:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/maths/defis/aleatoire - Obtenir un défi aléatoire
router.get('/defis/aleatoire', (_req, res) => {
  try {
    const defi = mathsGenerator.getRandomDefi();
    res.json({
      success: true,
      data: defi
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du défi aléatoire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/maths/defis/aleatoire/niveau/:niveau - Obtenir un défi aléatoire par niveau
router.get('/defis/aleatoire/niveau/:niveau', (req, res) => {
  try {
    const niveau = parseInt(req.params.niveau);
    
    if (isNaN(niveau) || niveau < 1 || niveau > 5) {
      return res.status(400).json({
        success: false,
        error: 'Niveau invalide (doit être entre 1 et 5)'
      });
    }
    
    const defi = mathsGenerator.getRandomDefiByNiveau(niveau);
    
    if (!defi) {
      return res.status(404).json({
        success: false,
        error: 'Aucun défi trouvé pour ce niveau'
      });
    }
    
    res.json({
      success: true,
      data: defi
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du défi aléatoire par niveau:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/maths/defis/progression/:niveauEleve - Obtenir des défis adaptés au niveau de l'élève
router.get('/defis/progression/:niveauEleve', (req, res) => {
  try {
    const niveauEleve = parseInt(req.params.niveauEleve);
    
    if (isNaN(niveauEleve) || niveauEleve < 1) {
      return res.status(400).json({
        success: false,
        error: 'Niveau élève invalide (doit être >= 1)'
      });
    }
    
    const defis = mathsGenerator.getDefisForProgression(niveauEleve);
    res.json({
      success: true,
      data: defis,
      count: defis.length,
      niveauEleve
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des défis de progression:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/maths/stats - Obtenir les statistiques des défis
router.get('/stats', (_req, res) => {
  try {
    const stats = mathsGenerator.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats maths:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

export default router; 