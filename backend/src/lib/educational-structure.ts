// ===== STRUCTURE ÉDUCATIVE REVED KIDS =====
// Framework pour organiser le contenu éducatif par niveau et matière

export type NiveauScolaire = 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2';
export type Matiere = 'francais' | 'maths';
export type TypeContenu = 'animation' | 'exercice';

// Structure de base pour un contenu éducatif
export interface ContenuEducatif {
  id: string;
  niveau: NiveauScolaire;
  matiere: Matiere;
  type: TypeContenu;
  titre: string;
  description: string;
  difficulte: 'facile' | 'moyen' | 'difficile';
  dureeEstimee: number; // en minutes
  competences: string[]; // IDs des compétences
  chapitre: string; // ID du chapitre
  ordre: number; // ordre dans le chapitre
  actif: boolean;
  dateCreation: Date;
  dateModification: Date;
}

// Structure pour les animations
export interface Animation extends ContenuEducatif {
  type: 'animation';
  typeAnimation: 'introduction' | 'explication' | 'demonstration' | 'interactive';
  ressources: {
    video?: string;
    audio?: string;
    images?: string[];
    scripts?: string[];
  };
  interactions: {
    type: 'click' | 'drag' | 'voice' | 'gesture' | 'none';
    elements: string[];
  };
}

// Structure pour les exercices
export interface Exercice extends ContenuEducatif {
  type: 'exercice';
  typeExercice: 'qcm' | 'drag-drop' | 'texte-libre' | 'calcul' | 'dictation' | 'reconnaissance';
  questions: Question[];
  tempsLimite?: number; // en secondes
  tentativesMax: number;
  points: number;
  feedback: {
    immediat: boolean;
    messages: {
      reussi: string;
      echec: string;
      partiel: string;
    };
  };
}

// Structure pour une question
export interface Question {
  id: string;
  type: 'qcm' | 'drag-drop' | 'texte-libre' | 'calcul' | 'dictation' | 'reconnaissance';
  enonce: string;
  consigne: string;
  reponses?: string[];
  reponseCorrecte: string | string[] | number | number[];
  points: number;
  indice?: string;
  explication?: string;
}

// Structure pour les chapitres
export interface Chapitre {
  id: string;
  niveau: NiveauScolaire;
  matiere: Matiere;
  titre: string;
  description: string;
  ordre: number;
  competences: string[];
  contenu: {
    animations: string[]; // IDs des animations
    exercices: string[]; // IDs des exercices
  };
}

// Structure pour les compétences
export interface Competence {
  id: string;
  niveau: NiveauScolaire;
  matiere: Matiere;
  code: string; // ex: "CP.FR.01" pour CP Français compétence 1
  titre: string;
  description: string;
  chapitres: string[]; // IDs des chapitres qui développent cette compétence
}

// Structure pour la progression d'un élève
export interface ProgressionEleve {
  eleveId: string;
  niveau: NiveauScolaire;
  matiere: Matiere;
  chapitreId: string;
  contenuId: string;
  statut: 'non-commence' | 'en-cours' | 'termine' | 'reussi' | 'echec';
  score?: number;
  tempsPasse: number; // en secondes
  tentatives: number;
  dateDebut?: Date;
  dateFin?: Date;
  erreurs: string[];
  commentaires?: string;
}

// Structure pour les statistiques
export interface StatistiquesContenu {
  contenuId: string;
  totalUtilisations: number;
  tauxReussite: number;
  tempsMoyen: number;
  erreursFrequentes: string[];
  niveauDifficulte: 'facile' | 'moyen' | 'difficile';
}

// ===== ORGANISATION PAR NIVEAU =====

export interface StructureNiveau {
  niveau: NiveauScolaire;
  matieres: {
    francais: StructureMatiere;
    maths: StructureMatiere;
  };
}

export interface StructureMatiere {
  matiere: Matiere;
  chapitres: Chapitre[];
  competences: Competence[];
  progression: {
    ordreChapitres: string[];
    prerequis: Record<string, string[]>; // chapitreId -> prerequis
  };
}

// ===== FONCTIONS UTILITAIRES =====

export const NIVEAUX_SCOLAIRES: NiveauScolaire[] = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
export const MATIERES: Matiere[] = ['francais', 'maths'];
export const TYPES_CONTENU: TypeContenu[] = ['animation', 'exercice'];

// Validation des structures
export const validerContenu = (contenu: ContenuEducatif): boolean => {
  return !!(
    contenu.id &&
    NIVEAUX_SCOLAIRES.includes(contenu.niveau) &&
    MATIERES.includes(contenu.matiere) &&
    TYPES_CONTENU.includes(contenu.type) &&
    contenu.titre &&
    contenu.description
  );
};

export const genererIdContenu = (
  niveau: NiveauScolaire,
  matiere: Matiere,
  type: TypeContenu,
  titre: string
): string => {
  const timestamp = Date.now();
  const titreNormalise = titre
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${niveau.toLowerCase()}-${matiere}-${type}-${titreNormalise}-${timestamp}`;
};

// ===== EXPORT DE LA STRUCTURE COMPLÈTE =====

export interface StructureEducativeComplete {
  niveaux: Record<NiveauScolaire, StructureNiveau>;
  metadata: {
    version: string;
    dateCreation: Date;
    derniereModification: Date;
    auteur: string;
  };
}

// Template pour créer une nouvelle structure
export const creerStructureVide = (): StructureEducativeComplete => ({
  niveaux: {
    CP: {
      niveau: 'CP',
      matieres: {
        francais: {
          matiere: 'francais',
          chapitres: [],
          competences: [],
          progression: {
            ordreChapitres: [],
            prerequis: {}
          }
        },
        maths: {
          matiere: 'maths',
          chapitres: [],
          competences: [],
          progression: {
            ordreChapitres: [],
            prerequis: {}
          }
        }
      }
    },
    CE1: {
      niveau: 'CE1',
      matieres: {
        francais: {
          matiere: 'francais',
          chapitres: [],
          competences: [],
          progression: {
            ordreChapitres: [],
            prerequis: {}
          }
        },
        maths: {
          matiere: 'maths',
          chapitres: [],
          competences: [],
          progression: {
            ordreChapitres: [],
            prerequis: {}
          }
        }
      }
    },
    CE2: {
      niveau: 'CE2',
      matieres: {
        francais: {
          matiere: 'francais',
          chapitres: [],
          competences: [],
          progression: {
            ordreChapitres: [],
            prerequis: {}
          }
        },
        maths: {
          matiere: 'maths',
          chapitres: [],
          competences: [],
          progression: {
            ordreChapitres: [],
            prerequis: {}
          }
        }
      }
    },
    CM1: {
      niveau: 'CM1',
      matieres: {
        francais: {
          matiere: 'francais',
          chapitres: [],
          competences: [],
          progression: {
            ordreChapitres: [],
            prerequis: {}
          }
        },
        maths: {
          matiere: 'maths',
          chapitres: [],
          competences: [],
          progression: {
            ordreChapitres: [],
            prerequis: {}
          }
        }
      }
    },
    CM2: {
      niveau: 'CM2',
      matieres: {
        francais: {
          matiere: 'francais',
          chapitres: [],
          competences: [],
          progression: {
            ordreChapitres: [],
            prerequis: {}
          }
        },
        maths: {
          matiere: 'maths',
          chapitres: [],
          competences: [],
          progression: {
            ordreChapitres: [],
            prerequis: {}
          }
        }
      }
    }
  },
  metadata: {
    version: '1.0.0',
    dateCreation: new Date(),
    derniereModification: new Date(),
    auteur: 'RevEd Kids Team'
  }
}); 