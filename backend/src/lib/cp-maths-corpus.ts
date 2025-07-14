// --- CRÉATURES MAGIQUES ---
export interface CreatureMagique {
  id: string;
  nombre: number;
  nom: string;
  emoji: string;
  couleur: string;
  description: string;
  animation: string;
  pouvoir: string;
}

export const CREATURES_MAGIQUES: CreatureMagique[] = [
  { id: 'zero', nombre: 0, nom: 'Vide Mystique', emoji: '🫥', couleur: 'from-gray-400 to-gray-600', description: 'Le gardien du néant', animation: 'opacity-50', pouvoir: 'Disparition' },
  { id: 'un', nombre: 1, nom: 'Luciole Solitaire', emoji: '✨', couleur: 'from-yellow-400 to-yellow-600', description: 'Petite mais brillante', animation: 'animate-pulse', pouvoir: 'Lumière' },
  { id: 'deux', nombre: 2, nom: 'Papillons Jumeaux', emoji: '🦋', couleur: 'from-blue-400 to-blue-600', description: 'Toujours ensemble', animation: 'animate-bounce', pouvoir: 'Symétrie' },
  { id: 'trois', nombre: 3, nom: 'Trèfle Magique', emoji: '🍀', couleur: 'from-green-400 to-green-600', description: 'Porte-bonheur triple', animation: 'animate-spin', pouvoir: 'Chance' },
  { id: 'quatre', nombre: 4, nom: 'Tortue Sage', emoji: '🐢', couleur: 'from-emerald-400 to-emerald-600', description: 'Stable sur ses 4 pattes', animation: 'animate-none', pouvoir: 'Stabilité' },
  { id: 'cinq', nombre: 5, nom: 'Étoile Dorée', emoji: '⭐', couleur: 'from-amber-400 to-amber-600', description: 'Brillante à 5 branches', animation: 'animate-ping', pouvoir: 'Éclat' },
  { id: 'six', nombre: 6, nom: 'Abeille Travailleuse', emoji: '🐝', couleur: 'from-orange-400 to-orange-600', description: 'Hexagone parfait', animation: 'animate-bounce', pouvoir: 'Industrie' },
  { id: 'sept', nombre: 7, nom: 'Arc-en-ciel', emoji: '🌈', couleur: 'from-purple-400 to-pink-600', description: 'Mystique et coloré', animation: 'animate-pulse', pouvoir: 'Magie' },
  { id: 'huit', nombre: 8, nom: 'Pieuvre Câline', emoji: '🐙', couleur: 'from-indigo-400 to-indigo-600', description: '8 tentacules amicales', animation: 'animate-wiggle', pouvoir: 'Câlins' },
  { id: 'neuf', nombre: 9, nom: 'Chat à 9 Vies', emoji: '🐱', couleur: 'from-pink-400 to-pink-600', description: 'Presque parfait', animation: 'animate-bounce', pouvoir: 'Résurrection' },
  { id: 'dix', nombre: 10, nom: 'Dragon Gardien', emoji: '🐉', couleur: 'from-red-400 to-red-600', description: 'Maître de la dizaine', animation: 'animate-pulse', pouvoir: 'Feu Sacré' },
  { id: 'onze', nombre: 11, nom: 'Tours Jumelles', emoji: '🏗️', couleur: 'from-slate-400 to-slate-600', description: 'Hautes et fières', animation: 'animate-none', pouvoir: 'Construction' },
  { id: 'douze', nombre: 12, nom: 'Horloge Magique', emoji: '🕐', couleur: 'from-cyan-400 to-cyan-600', description: 'Maîtresse du temps', animation: 'animate-spin', pouvoir: 'Temps' },
  { id: 'treize', nombre: 13, nom: 'Sorcier Mystère', emoji: '🧙‍♂️', couleur: 'from-violet-400 to-violet-600', description: 'Nombre mystérieux', animation: 'animate-pulse', pouvoir: 'Mystère' },
  { id: 'quatorze', nombre: 14, nom: 'Coeur d\'Amour', emoji: '💖', couleur: 'from-rose-400 to-rose-600', description: 'Plein de tendresse', animation: 'animate-ping', pouvoir: 'Amour' },
  { id: 'quinze', nombre: 15, nom: 'Cristal de Glace', emoji: '💎', couleur: 'from-sky-400 to-sky-600', description: 'Pur et brillant', animation: 'animate-pulse', pouvoir: 'Purification' },
  { id: 'seize', nombre: 16, nom: 'Château Fort', emoji: '🏰', couleur: 'from-stone-400 to-stone-600', description: 'Imprenable forteresse', animation: 'animate-none', pouvoir: 'Protection' },
  { id: 'dixsept', nombre: 17, nom: 'Fée Danseuse', emoji: '🧚‍♀️', couleur: 'from-teal-400 to-teal-600', description: 'Gracieuse et magique', animation: 'animate-bounce', pouvoir: 'Grâce' },
  { id: 'dixhuit', nombre: 18, nom: 'Lune Pleine', emoji: '🌕', couleur: 'from-indigo-400 to-purple-600', description: 'Rayonnante nocturne', animation: 'animate-pulse', pouvoir: 'Nuit' },
  { id: 'dixneuf', nombre: 19, nom: 'Soleil Couchant', emoji: '🌅', couleur: 'from-orange-400 to-red-600', description: 'Presque au sommet', animation: 'animate-ping', pouvoir: 'Aurore' },
  { id: 'vingt', nombre: 20, nom: 'Roi des Nombres', emoji: '👑', couleur: 'from-yellow-500 to-orange-500', description: 'Majesté suprême', animation: 'animate-pulse', pouvoir: 'Royauté' }
];

// --- PIERRES DE POUVOIR ---
export interface PierrePouvoir {
  id: string;
  valeur: number;
  couleur: string;
  emoji: string;
  nom: string;
  taille: 'petit' | 'moyen' | 'grand';
}

export const PIERRES_POUVOIR: PierrePouvoir[] = [
  { id: 'unite_1', valeur: 1, couleur: 'from-blue-300 to-blue-500', emoji: '💙', nom: 'Perle Unique', taille: 'petit' },
  { id: 'unite_2', valeur: 2, couleur: 'from-green-300 to-green-500', emoji: '💚', nom: 'Duo Emeraude', taille: 'petit' },
  { id: 'unite_3', valeur: 3, couleur: 'from-purple-300 to-purple-500', emoji: '💜', nom: 'Triple Améthyste', taille: 'moyen' },
  { id: 'unite_4', valeur: 4, couleur: 'from-red-300 to-red-500', emoji: '❤️', nom: 'Quad Rubis', taille: 'moyen' },
  { id: 'unite_5', valeur: 5, couleur: 'from-yellow-300 to-yellow-500', emoji: '💛', nom: 'Penta Topaze', taille: 'moyen' },
  { id: 'unite_6', valeur: 6, couleur: 'from-pink-300 to-pink-500', emoji: '🩷', nom: 'Hexa Rose', taille: 'grand' },
  { id: 'unite_7', valeur: 7, couleur: 'from-cyan-300 to-cyan-500', emoji: '🩵', nom: 'Septa Turquoise', taille: 'grand' },
  { id: 'unite_8', valeur: 8, couleur: 'from-orange-300 to-orange-500', emoji: '🧡', nom: 'Octo Ambre', taille: 'grand' },
  { id: 'unite_9', valeur: 9, couleur: 'from-indigo-300 to-indigo-500', emoji: '💙', nom: 'Nova Saphir', taille: 'grand' },
  { id: 'dizaine_10', valeur: 10, couleur: 'from-gradient-rainbow', emoji: '🔟', nom: 'Cristal Dragon', taille: 'grand' }
];

// --- DÉFIS MATHÉMATIQUES ---
export interface DefiMath {
  id: string;
  type: 'decomposition' | 'complement' | 'addition' | 'soustraction' | 'comparaison';
  niveau: number;
  cible: number;
  pierresDisponibles: number[];
  solutions: number[][];
  consigne: string;
  indice: string;
  creature: CreatureMagique;
  difficulte: 'facile' | 'moyen' | 'difficile';
  bonusObjectif?: string;
  tempsLimite?: number;
}

// --- GÉNÉRATION DES DÉFIS ---
const genererDefisSoustraction = (): DefiMath[] => {
  const defis: DefiMath[] = [];
  let defiId = 1;
  
  // Soustraction simple (niveau 1-2)
  for (let depart = 5; depart <= 10; depart++) {
    for (let retrait = 1; retrait < depart; retrait++) {
      const resultat = depart - retrait;
      const creature = CREATURES_MAGIQUES.find(c => c.nombre === resultat)!;
      
      defis.push({
        id: `soustraction_${depart}_${retrait}_${defiId++}`,
        type: 'soustraction',
        niveau: depart <= 7 ? 1 : 2,
        cible: resultat,
        pierresDisponibles: [depart, retrait, resultat, resultat + 1, resultat - 1].filter(n => n > 0),
        solutions: [[depart, retrait]],
        consigne: `Tu as ${depart} cristaux. Tu en donnes ${retrait}. Combien te reste-t-il ?`,
        indice: `${depart} - ${retrait} = ?`,
        creature,
        difficulte: depart <= 7 ? 'facile' : 'moyen'
      });
    }
  }
  
  // Soustraction avec dizaines (niveau 3-4)
  for (let depart = 15; depart <= 20; depart++) {
    for (let retrait = 5; retrait <= 10; retrait++) {
      const resultat = depart - retrait;
      const creature = CREATURES_MAGIQUES.find(c => c.nombre === resultat)!;
      
      defis.push({
        id: `soustraction_dizaine_${depart}_${retrait}_${defiId++}`,
        type: 'soustraction',
        niveau: 3,
        cible: resultat,
        pierresDisponibles: [depart, retrait, resultat, 10, resultat + 2, resultat - 2].filter(n => n > 0),
        solutions: [[depart, retrait]],
        consigne: `Le Dragon a ${depart} trésors. Il en partage ${retrait}. Combien garde-t-il ?`,
        indice: `Utilise le Cristal Dragon (10) pour t'aider`,
        creature,
        difficulte: 'moyen',
        bonusObjectif: 'Trouve en moins de 15 secondes',
        tempsLimite: 30
      });
    }
  }
  
  return defis;
};

export const genererDefisProgression = (): DefiMath[] => {
  const defis: DefiMath[] = [];
  let defiId = 1;
  
  // NIVEAU 1: Nombres 1-5 (Décomposition simple)
  for (let cible = 2; cible <= 5; cible++) {
    const creature = CREATURES_MAGIQUES.find(c => c.nombre === cible)!;
    const solutions: number[][] = [];
    const pierresDisponibles: number[] = [];
    
    // Toutes les décompositions possibles
    for (let a = 1; a < cible; a++) {
      const b = cible - a;
      if (b > 0 && a <= b) { // Éviter les doublons (2+3 = 3+2)
        solutions.push([a, b]);
        pierresDisponibles.push(a, b);
      }
    }
    
    // Ajouter quelques pierres distractrices
    for (let i = 1; i <= cible + 2; i++) {
      if (!pierresDisponibles.includes(i)) {
        pierresDisponibles.push(i);
      }
    }
    
    defis.push({
      id: `decomp_${cible}_${defiId++}`,
      type: 'decomposition',
      niveau: 1,
      cible,
      pierresDisponibles: [...new Set(pierresDisponibles)].sort(),
      solutions,
      consigne: `Réveille ${creature.nom} en trouvant comment faire ${cible} !`,
      indice: `Cherche deux pierres qui font ${cible} ensemble`,
      creature,
      difficulte: 'facile'
    });
  }
  
  // NIVEAU 2: Nombres 6-10 (Décomposition + compléments)
  for (let cible = 6; cible <= 10; cible++) {
    const creature = CREATURES_MAGIQUES.find(c => c.nombre === cible)!;
    const solutions: number[][] = [];
    const pierresDisponibles: number[] = [];
    
    for (let a = 1; a < cible; a++) {
      const b = cible - a;
      if (b > 0 && a <= b) {
        solutions.push([a, b]);
        pierresDisponibles.push(a, b);
      }
    }
    
    // Pierres distractrices plus nombreuses
    for (let i = 1; i <= 12; i++) {
      pierresDisponibles.push(i);
    }
    
    defis.push({
      id: `decomp_${cible}_${defiId++}`,
      type: 'decomposition',
      niveau: 2,
      cible,
      pierresDisponibles: [...new Set(pierresDisponibles)].sort(),
      solutions,
      consigne: `Libère la magie de ${creature.nom} (${cible}) !`,
      indice: `${cible} = ? + ?`,
      creature,
      difficulte: cible <= 7 ? 'facile' : 'moyen'
    });
  }
  
  // NIVEAU 3: Compléments à 10 (Spécial Dragon)
  const dragonCreature = CREATURES_MAGIQUES.find(c => c.nombre === 10)!;
  for (let manquant = 1; manquant <= 9; manquant++) {
    const complement = 10 - manquant;
    
    defis.push({
      id: `complement_10_${manquant}_${defiId++}`,
      type: 'complement',
      niveau: 3,
      cible: 10,
      pierresDisponibles: [1, 2, 3, 4, 5, 6, 7, 8, 9, complement],
      solutions: [[manquant, complement]],
      consigne: `Le Dragon Gardien a ${manquant}... Que lui manque-t-il pour avoir 10 ?`,
      indice: `${manquant} + ? = 10`,
      creature: dragonCreature,
      difficulte: 'moyen',
      bonusObjectif: 'Trouve en moins de 10 secondes',
      tempsLimite: 20
    });
  }
  
  // NIVEAU 4: Nombres 11-15 (Avec dizaine)
  for (let cible = 11; cible <= 15; cible++) {
    const creature = CREATURES_MAGIQUES.find(c => c.nombre === cible)!;
    const solutions: number[][] = [];
    const pierresDisponibles = [10]; // Cristal Dragon obligatoire
    
    // Solutions avec 10 + unités
    const unites = cible - 10;
    solutions.push([10, unites]);
    pierresDisponibles.push(unites);
    
    // Solutions alternatives (décomposition des unités)
    for (let a = 1; a < unites; a++) {
      const b = unites - a;
      if (b > 0) {
        solutions.push([10, a, b]);
        pierresDisponibles.push(a, b);
      }
    }
    
    // Pierres distractrices
    for (let i = 1; i <= 9; i++) {
      pierresDisponibles.push(i);
    }
    
    defis.push({
      id: `dizaine_${cible}_${defiId++}`,
      type: 'addition',
      niveau: 4,
      cible,
      pierresDisponibles: [...new Set(pierresDisponibles)].sort(),
      solutions,
      consigne: `Aide ${creature.nom} à atteindre ${cible} avec le Cristal Dragon !`,
      indice: `Utilise le Cristal Dragon (10) + d'autres pierres`,
      creature,
      difficulte: 'moyen'
    });
  }
  
  // NIVEAU 5: Nombres 16-20 (Défi avancé)
  for (let cible = 16; cible <= 20; cible++) {
    const creature = CREATURES_MAGIQUES.find(c => c.nombre === cible)!;
    const solutions: number[][] = [];
    const pierresDisponibles = [10];
    
    const unites = cible - 10;
    solutions.push([10, unites]);
    pierresDisponibles.push(unites);
    
    // Décompositions multiples
    for (let a = 1; a < unites; a++) {
      const b = unites - a;
      if (b > 0) {
        solutions.push([10, a, b]);
        pierresDisponibles.push(a, b);
      }
    }
    
    // Autres décompositions créatives
    for (let premiere = 5; premiere <= 9; premiere++) {
      const reste = cible - premiere;
      if (reste >= premiere && reste <= 15) {
        solutions.push([premiere, reste]);
        pierresDisponibles.push(premiere, reste);
      }
    }
    
    defis.push({
      id: `avance_${cible}_${defiId++}`,
      type: 'addition',
      niveau: 5,
      cible,
      pierresDisponibles: [...new Set(pierresDisponibles)].sort(),
      solutions,
      consigne: `Défi EXPERT ! Réveille ${creature.nom} - Roi des Nombres !`,
      indice: `Nombreuses façons de faire ${cible}... Sois créatif !`,
      creature,
      difficulte: 'difficile',
      bonusObjectif: 'Trouve 2 solutions différentes',
      tempsLimite: 60
    });
  }
  
  // Ajouter les défis de soustraction
  defis.push(...genererDefisSoustraction());
  
  return defis;
};

export const DEFIS_MATHEMATIQUES = genererDefisProgression();

// --- SYSTÈME DE RÉCOMPENSES ---
export interface RecompenseMath {
  cristaux: number;
  etoiles: number;
  pouvoirsMagiques: string[];
  achievement: string;
  effetVisuel: string;
  niveau: 'bronze' | 'argent' | 'or' | 'platine' | 'diamant';
}

export const calculerRecompenses = (
  defi: DefiMath,
  tempsEcoule: number,
  solutionsTrouvees: number,
  bonusReussi: boolean
): RecompenseMath => {
  let cristaux = 10 * defi.niveau;
  let etoiles = defi.niveau;
  let pouvoirsMagiques: string[] = [];
  let achievement = "";
  let effetVisuel = "sparkles";
  let niveau: 'bronze' | 'argent' | 'or' | 'platine' | 'diamant' = 'bronze';
  
  // Bonus vitesse
  if (defi.tempsLimite && tempsEcoule <= defi.tempsLimite * 0.5) {
    cristaux += 20;
    etoiles += 2;
    pouvoirsMagiques.push("Vitesse Éclair");
    niveau = 'or';
    achievement = "⚡ Matheux Rapide !";
    effetVisuel = "lightning";
  } else if (defi.tempsLimite && tempsEcoule <= defi.tempsLimite * 0.75) {
    cristaux += 10;
    etoiles += 1;
    niveau = 'argent';
  }
  
  // Bonus créativité (solutions multiples)
  if (solutionsTrouvees > 1) {
    cristaux += solutionsTrouvees * 5;
    etoiles += solutionsTrouvees;
    pouvoirsMagiques.push("Esprit Créatif");
    niveau = 'platine';
    achievement = "🧠 Génie des Maths !";
    effetVisuel = "rainbow";
  }
  
  // Bonus objectif
  if (bonusReussi) {
    cristaux += 30;
    etoiles += 3;
    pouvoirsMagiques.push("Maître des Défis");
    niveau = 'diamant';
    achievement = "💎 Perfection Mathématique !";
    effetVisuel = "diamond_explosion";
  }
  
  // Achievement par type
  if (!achievement) {
    if (defi.type === 'complement') {
      achievement = "🐉 Ami du Dragon !";
    } else if (defi.type === 'decomposition') {
      achievement = "🔍 Explorateur de Nombres !";
    } else if (defi.type === 'soustraction') {
      achievement = "➖ Maître de la Soustraction !";
    } else {
      achievement = "✨ Magicien Débutant !";
    }
  }
  
  return { cristaux, etoiles, pouvoirsMagiques, achievement, effetVisuel, niveau };
}; 