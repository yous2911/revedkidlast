import express from 'express';
import { getDefisMassifs, getDefisPourPeriode, getDefisPourDifficulte } from '../lib/defisGenerator';

const router = express.Router();

// Get all challenges
router.get('/massifs', (req, res) => {
  try {
    const defis = getDefisMassifs();
    res.json(defis);
  } catch (err) {
    console.error("Erreur génération défis massifs:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Get challenges for specific period
router.get('/periode/:periode', (req, res) => {
  try {
    const periode = parseInt(req.params.periode);
    if (isNaN(periode) || periode < 1 || periode > 5) {
      return res.status(400).json({ error: "Période invalide (1-5)" });
    }
    
    const defis = getDefisPourPeriode(periode);
    res.json(defis);
  } catch (err) {
    console.error("Erreur génération défis pour période:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Get challenges for specific difficulty
router.get('/difficulte/:difficulte', (req, res) => {
  try {
    const difficulte = req.params.difficulte;
    const difficultesValides = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    
    if (!difficultesValides.includes(difficulte)) {
      return res.status(400).json({ error: "Difficulté invalide" });
    }
    
    const defis = getDefisPourDifficulte(difficulte);
    res.json(defis);
  } catch (err) {
    console.error("Erreur génération défis pour difficulté:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router; 