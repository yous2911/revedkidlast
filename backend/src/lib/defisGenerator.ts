import { DefiGenerator, WordChallenge } from './cp-corpus';

export function getDefisMassifs(): WordChallenge[] {
  return DefiGenerator.genererDefisProgression();
}

export function getDefisPourPeriode(periode: number): WordChallenge[] {
  return DefiGenerator.genererDefisPourPeriode(periode);
}

export function getDefisPourDifficulte(difficulte: string): WordChallenge[] {
  return DefiGenerator.genererDefisPourDifficulte(difficulte);
} 