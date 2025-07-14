export interface WordChallenge {
  id: string;
  targetWord: string;
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  period: number;
  type: 'assembly' | 'dictation' | 'speed' | 'creativity';
  components: any[];
  dropZones: any[];
  hint: string;
  successMessage: string;
  magicEffect: string;
  requiredAccuracy: number;
  timeLimit?: number;
  bonusObjective?: string;
}

export async function getDefisMassifs(): Promise<WordChallenge[]> {
  const response = await fetch('/api/defis/massifs');
  if (!response.ok) throw new Error('Erreur lors du chargement des défis massifs');
  return await response.json();
}

export async function getDefisPourPeriode(periode: number): Promise<WordChallenge[]> {
  const response = await fetch(`/api/defis/periode/${periode}`);
  if (!response.ok) throw new Error('Erreur lors du chargement des défis pour cette période');
  return await response.json();
}

export async function getDefisPourDifficulte(difficulte: string): Promise<WordChallenge[]> {
  const response = await fetch(`/api/defis/difficulte/${difficulte}`);
  if (!response.ok) throw new Error('Erreur lors du chargement des défis pour cette difficulté');
  return await response.json();
} 