import express from 'express';
import { getDefisMassifs, getDefisPourPeriode, getDefisPourDifficulte } from '../lib/defisGenerator';

const router = express.Router();

// GET /api/defis/massifs - Obtenir tous les défis de phonétique
router.get('/massifs', (_req, res) => {
  try {
    const defis = getDefisMassifs();
    res.json({
      success: true,
      data: defis,
      count: defis.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des défis:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/defis/periode/:periode - Obtenir des défis par période
router.get('/periode/:periode', (req, res) => {
  try {
    const periode = parseInt(req.params.periode);
    if (isNaN(periode) || periode < 1 || periode > 5) {
      return res.status(400).json({
        success: false,
        error: 'Période invalide (doit être entre 1 et 5)'
      });
    }
    
    const defis = getDefisPourPeriode(periode);
    
    if (!defis || defis.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucun défi trouvé pour cette période'
      });
    }
    
    res.json({
      success: true,
      data: defis,
      count: defis.length,
      periode
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des défis par période:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/defis/difficulte/:difficulte - Obtenir des défis par difficulté
router.get('/difficulte/:difficulte', (req, res) => {
  try {
    const { difficulte } = req.params;
    const defis = getDefisPourDifficulte(difficulte);
    
    if (!defis || defis.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucun défi trouvé pour cette difficulté'
      });
    }
    
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

export default router; 