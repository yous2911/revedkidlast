// backend/src/lib/cp-corpus.ts
// Massive CP Corpus 2025 - French Phonics Learning System

export interface MagicBlock {
  id: string;
  type: 'phoneme' | 'syllabe' | 'mot';
  content: string;
  color: string;
  size: 'petit' | 'moyen' | 'grand';
  magnetism: number;
  vibration: boolean;
  isPlaced: boolean;
  correctPosition?: number;
  audioKey: string;
  sparkleIntensity: number;
}

export interface DropZone {
  id: string;
  position: number;
  acceptedTypes: string[];
  isActive: boolean;
  isCorrect: boolean;
  currentBlock: MagicBlock | null;
  magneticField: boolean;
}

export interface WordChallenge {
  id: string;
  targetWord: string;
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  period: number;
  type: 'assembly' | 'dictation' | 'speed' | 'creativity';
  components: MagicBlock[];
  dropZones: DropZone[];
  hint: string;
  successMessage: string;
  magicEffect: string;
  requiredAccuracy: number;
  timeLimit?: number;
  bonusObjective?: string;
}

export const PROGRESSION_CP_2025 = {
  periode1: {
    phonemes: ['a', 'i', 'o', 'u', 'é', 'l', 'r', 'f', 'j', 'ou', 'eu', 'm', 'n', 's', 'p'],
    syllabes: ['la', 'li', 'lo', 'lu', 'lé', 'ra', 'ri', 'ro', 'ru', 'ré', 'fa', 'fi', 'fo', 'fu', 'fé'],
    mots: ['papa', 'mama', 'papi', 'mamie', 'ami', 'amie', 'rue', 'roue', 'lune', 'soleil', 'chat', 'rat']
  },
  periode2: {
    phonemes: ['v', 'ch', 'p', 't', 'b', 'd', 'c', 'k', 'qu', 'g', 'e', 'x'],
    syllabes: ['va', 'vi', 'vo', 'vu', 'vé', 'cha', 'chi', 'cho', 'chu', 'ché', 'pa', 'pi', 'po', 'pu', 'pé'],
    mots: ['chat', 'chaud', 'cheval', 'cheveu', 'chute', 'vache', 'voiture', 'table', 'tapis', 'tortue']
  },
  periode3: {
    phonemes: ['z', 'w', 'y', 'h', 'ph', 'th', 'gn', 'ai', 'ei', 'oi', 'ui'],
    syllabes: ['za', 'zi', 'zo', 'zu', 'zé', 'wa', 'wi', 'wo', 'wu', 'wé', 'ya', 'yi', 'yo', 'yu', 'yé'],
    mots: ['zoo', 'zèbre', 'zéro', 'wagon', 'watt', 'yacht', 'yaourt', 'yeux', 'yeux', 'yeux']
  },
  periode4: {
    phonemes: ['an', 'en', 'in', 'on', 'un', 'ain', 'ein', 'oin', 'ien'],
    syllabes: ['an', 'en', 'in', 'on', 'un', 'ain', 'ein', 'oin', 'ien'],
    mots: ['enfant', 'maman', 'papa', 'chat', 'rat', 'chat', 'rat', 'chat', 'rat']
  },
  periode5: {
    phonemes: ['er', 'ir', 'ur', 'or', 'ar', 'air', 'oir', 'eur'],
    syllabes: ['er', 'ir', 'ur', 'or', 'ar', 'air', 'oir', 'eur'],
    mots: ['manger', 'dormir', 'courir', 'parler', 'chanter', 'danser', 'jouer']
  }
};

export class DefiGenerator {
  static genererDefisProgression(): WordChallenge[] {
    const challenges: WordChallenge[] = [];
    let id = 1;

    // Generate challenges for each period
    Object.entries(PROGRESSION_CP_2025).forEach(([periodKey, periodData]) => {
      const periodNumber = parseInt(periodKey.replace('periode', ''));
      
      // Phoneme challenges
      periodData.phonemes.forEach((phoneme, index) => {
        challenges.push({
          id: `phoneme_${phoneme}_${id++}`,
          targetWord: phoneme,
          difficulty: this.getDifficultyForPeriod(periodNumber),
          period: periodNumber,
          type: 'assembly',
          hint: `🔤 Assemble le son "${phoneme}"`,
          successMessage: `✨ Parfait ! Tu maîtrises le son "${phoneme}" !`,
          magicEffect: 'phoneme_glow',
          requiredAccuracy: 90,
          components: [{
            id: `phoneme_${phoneme}`,
            type: 'phoneme',
            content: phoneme,
            color: this.getColorForType('phoneme'),
            size: 'petit',
            magnetism: 3,
            vibration: true,
            isPlaced: false,
            correctPosition: 0,
            audioKey: `phoneme_${phoneme}`,
            sparkleIntensity: 2
          }],
          dropZones: [{
            id: 'zone_0',
            position: 0,
            acceptedTypes: ['phoneme'],
            isActive: false,
            isCorrect: false,
            currentBlock: null,
            magneticField: false
          }]
        });
      });

      // Syllable challenges
      periodData.syllabes.forEach((syllabe, index) => {
        const lettres = syllabe.split('');
        challenges.push({
          id: `syllabe_${syllabe}_${id++}`,
          targetWord: syllabe,
          difficulty: this.getDifficultyForPeriod(periodNumber),
          period: periodNumber,
          type: 'assembly',
          hint: `📝 Forme la syllabe "${syllabe}"`,
          successMessage: `🎉 Excellent ! La syllabe "${syllabe}" est parfaite !`,
          magicEffect: 'syllabe_fusion',
          requiredAccuracy: 95,
          components: lettres.map((lettre, pos) => ({
            id: `lettre_${lettre}_${pos}`,
            type: 'phoneme',
            content: lettre,
            color: this.getColorForType('syllabe'),
            size: 'petit',
            magnetism: 2,
            vibration: false,
            isPlaced: false,
            correctPosition: pos,
            audioKey: `phoneme_${lettre}`,
            sparkleIntensity: 3
          })),
          dropZones: lettres.map((_, pos) => ({
            id: `zone_${pos}`,
            position: pos,
            acceptedTypes: ['phoneme'],
            isActive: false,
            isCorrect: false,
            currentBlock: null,
            magneticField: false
          }))
        });
      });

      // Word challenges
      periodData.mots.forEach((mot, index) => {
        const syllabes = this.diviserEnSyllabes(mot);
        challenges.push({
          id: `mot_${mot}_${id++}`,
          targetWord: mot,
          difficulty: this.getDifficultyForPeriod(periodNumber),
          period: periodNumber,
          type: 'assembly',
          hint: `📚 Assemble le mot "${mot}"`,
          successMessage: `🌟 Fantastique ! Tu sais lire "${mot}" !`,
          magicEffect: 'mot_creation',
          requiredAccuracy: 98,
          timeLimit: 30,
          components: syllabes.map((syllabe, pos) => ({
            id: `syllabe_${syllabe}_${pos}`,
            type: 'syllabe',
            content: syllabe,
            color: this.getColorForType('mot'),
            size: 'moyen',
            magnetism: 1,
            vibration: true,
            isPlaced: false,
            correctPosition: pos,
            audioKey: `syllabe_${syllabe}`,
            sparkleIntensity: 4
          })),
          dropZones: syllabes.map((_, pos) => ({
            id: `zone_${pos}`,
            position: pos,
            acceptedTypes: ['syllabe'],
            isActive: false,
            isCorrect: false,
            currentBlock: null,
            magneticField: false
          }))
        });
      });
    });

    return challenges;
  }

  static getDifficultyForPeriod(period: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
    switch (period) {
      case 1: return 'bronze';
      case 2: return 'silver';
      case 3: return 'gold';
      case 4: return 'platinum';
      case 5: return 'diamond';
      default: return 'bronze';
    }
  }

  static getColorForType(type: string): string {
    switch (type) {
      case 'phoneme': return 'from-red-400 to-red-600';
      case 'syllabe': return 'from-blue-400 to-blue-600';
      case 'mot': return 'from-green-400 to-green-600';
      default: return 'from-gray-400 to-gray-600';
    }
  }

  static diviserEnSyllabes(mot: string): string[] {
    // Simple syllable division for French words
    const syllabes: string[] = [];
    let current = '';
    
    for (let i = 0; i < mot.length; i++) {
      current += mot[i];
      
      // Simple rules for syllable breaks
      if (i < mot.length - 1) {
        const next = mot[i + 1];
        const isVowel = /[aeiouyéèêëàâäôöùûüÿ]/.test(mot[i]);
        const nextIsVowel = /[aeiouyéèêëàâäôöùûüÿ]/.test(next);
        
        // Break between consonant-vowel
        if (!isVowel && nextIsVowel && current.length > 1) {
          syllabes.push(current.slice(0, -1));
          current = mot[i];
        }
      }
    }
    
    if (current) {
      syllabes.push(current);
    }
    
    return syllabes.length > 0 ? syllabes : [mot];
  }

  static genererDefisPourPeriode(periode: number): WordChallenge[] {
    const allChallenges = this.genererDefisProgression();
    return allChallenges.filter(challenge => challenge.period === periode);
  }

  static genererDefisPourDifficulte(difficulte: string): WordChallenge[] {
    const allChallenges = this.genererDefisProgression();
    return allChallenges.filter(challenge => challenge.difficulty === difficulte);
  }
} 