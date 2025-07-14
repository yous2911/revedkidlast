import { DEFIS_MATHEMATIQUES, DefiMath, genererDefisProgression } from './cp-maths-corpus';

export class MathsGenerator {
  private defis: DefiMath[];

  constructor() {
    this.defis = DEFIS_MATHEMATIQUES;
  }

  // Obtenir tous les défis
  getAllDefis(): DefiMath[] {
    return this.defis;
  }

  // Obtenir un défi par ID
  getDefiById(id: string): DefiMath | undefined {
    return this.defis.find(defi => defi.id === id);
  }

  // Obtenir des défis par niveau
  getDefisByNiveau(niveau: number): DefiMath[] {
    return this.defis.filter(defi => defi.niveau === niveau);
  }

  // Obtenir des défis par type
  getDefisByType(type: DefiMath['type']): DefiMath[] {
    return this.defis.filter(defi => defi.type === type);
  }

  // Obtenir des défis par difficulté
  getDefisByDifficulte(difficulte: DefiMath['difficulte']): DefiMath[] {
    return this.defis.filter(defi => defi.difficulte === difficulte);
  }

  // Obtenir un défi aléatoire
  getRandomDefi(): DefiMath {
    const randomIndex = Math.floor(Math.random() * this.defis.length);
    return this.defis[randomIndex]!;
  }

  // Obtenir un défi aléatoire par niveau
  getRandomDefiByNiveau(niveau: number): DefiMath | null {
    const defisNiveau = this.getDefisByNiveau(niveau);
    if (defisNiveau.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * defisNiveau.length);
    return defisNiveau[randomIndex]!;
  }

  // Obtenir des défis pour un niveau de progression
  getDefisForProgression(niveauEleve: number): DefiMath[] {
    // Logique de progression adaptative
    if (niveauEleve <= 1) {
      return this.getDefisByNiveau(1);
    } else if (niveauEleve <= 3) {
      return [...this.getDefisByNiveau(1), ...this.getDefisByNiveau(2)];
    } else if (niveauEleve <= 5) {
      return [...this.getDefisByNiveau(2), ...this.getDefisByNiveau(3)];
    } else if (niveauEleve <= 7) {
      return [...this.getDefisByNiveau(3), ...this.getDefisByNiveau(4)];
    } else {
      return this.defis; // Tous les défis pour les niveaux avancés
    }
  }

  // Obtenir des statistiques sur les défis
  getStats() {
    const totalDefis = this.defis.length;
    const defisParNiveau = {
      1: this.getDefisByNiveau(1).length,
      2: this.getDefisByNiveau(2).length,
      3: this.getDefisByNiveau(3).length,
      4: this.getDefisByNiveau(4).length,
      5: this.getDefisByNiveau(5).length,
    };
    
    const defisParType = {
      decomposition: this.getDefisByType('decomposition').length,
      complement: this.getDefisByType('complement').length,
      addition: this.getDefisByType('addition').length,
      soustraction: this.getDefisByType('soustraction').length,
      comparaison: this.getDefisByType('comparaison').length,
    };

    const defisParDifficulte = {
      facile: this.getDefisByDifficulte('facile').length,
      moyen: this.getDefisByDifficulte('moyen').length,
      difficile: this.getDefisByDifficulte('difficile').length,
    };

    return {
      totalDefis,
      defisParNiveau,
      defisParType,
      defisParDifficulte
    };
  }

  // Régénérer les défis (pour mise à jour dynamique)
  regenerateDefis(): void {
    this.defis = genererDefisProgression();
  }
} 