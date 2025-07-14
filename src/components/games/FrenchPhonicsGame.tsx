import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { defisService } from '../../services/defisService';
import type { DefiPhonique } from '../../types/shared';
import { AnimatedCard } from '../ui/AnimatedCard';
import { ProgressBar } from '../ui/ProgressBar';
import { SparkleElements, MagicElements, CelebrationElements } from '../ui/FloatingElements';
import { useSound } from '../../hooks/useSound';
import { useHaptic } from '../../hooks/useHaptic';

interface MagicBlock {
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

interface DropZone {
  id: string;
  position: number;
  acceptedTypes: string[];
  isActive: boolean;
  isCorrect: boolean;
  currentBlock: MagicBlock | null;
  magneticField: boolean;
}

export const FrenchPhonicsGame: React.FC = () => {
  // Game state
  const [challenges, setChallenges] = useState<DefiPhonique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [draggedBlock, setDraggedBlock] = useState<MagicBlock | null>(null);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<MagicBlock[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [showHint, setShowHint] = useState(true);
  const [showMagicEffects, setShowMagicEffects] = useState(false);
  const [comboCounter, setComboCounter] = useState(0);
  
  // Player progress
  const [playerProgress, setPlayerProgress] = useState({
    totalCrystals: 125,
    totalStardust: 340,
    totalMagicPoints: 1580,
    currentLevel: 4,
    knownSpells: ['Assemblage', 'Fusion', 'Harmonie'],
    achievements: ['Premier Mot', 'Vitesse Bronze', 'Créatif'],
    currentStreak: 7,
    completedChallenges: new Set<string>(),
    unlockedPeriods: [1, 2]
  });
  
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  // Load challenges from backend
  useEffect(() => {
    defisService.getDefisMassifs()
      .then((data) => {
        setChallenges(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Impossible de charger les défis");
        setLoading(false);
      });
  }, []);

  const currentChallenge = challenges[currentChallengeIndex] || null;

  // Initialize challenge
  useEffect(() => {
    if (currentChallenge) {
      resetChallenge();
    }
  }, [currentChallengeIndex, currentChallenge]);

  useEffect(() => {
    if (startTime > 0 && !isCompleted) {
      const timer = setInterval(() => {
        setTimeElapsed(Date.now() - startTime);
      }, 100);
      
      return () => clearInterval(timer);
    }
  }, [startTime, isCompleted]);

  const resetChallenge = useCallback(() => {
    if (!currentChallenge) return;
    
    setDropZones([...currentChallenge.dropZones]);
    setAvailableBlocks([...currentChallenge.components]);
    setIsCompleted(false);
    setStartTime(Date.now());
    setTimeElapsed(0);
    setComboCounter(0);
    setShowHint(true);
    
    setTimeout(() => {
      playSound('sparkle');
      triggerHaptic('light');
    }, 500);
  }, [currentChallenge, playSound, triggerHaptic]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <AnimatedCard variant="sparkle" className="max-w-md text-center">
            <div className="text-6xl mb-4">🔤</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Chargement des défis...
            </h2>
            <p className="text-gray-600">
              Préparation de tes exercices magiques
            </p>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <AnimatedCard variant="default" className="max-w-md text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Erreur de chargement
            </h2>
            <p className="text-white/80 mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold"
            >
              🔄 Réessayer
            </button>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  // No challenges available
  if (!currentChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <AnimatedCard variant="reward" className="max-w-md text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Aucun défi disponible
            </h2>
            <p className="text-gray-600">
              Tous les défis ont été complétés !
            </p>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  // Drag and drop handlers
  const handleDragStart = useCallback((block: MagicBlock) => {
    setDraggedBlock(block);
    playSound('click');
    triggerHaptic('light');
    
    setDropZones(prev => prev.map(zone => ({
      ...zone,
      magneticField: zone.acceptedTypes.includes(block.type),
      isActive: zone.acceptedTypes.includes(block.type)
    })));
  }, [playSound, triggerHaptic]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    
    if (!draggedBlock) return;
    
    const zone = dropZones.find(z => z.id === zoneId);
    if (!zone || !zone.acceptedTypes.includes(draggedBlock.type)) {
      playSound('incorrect');
      triggerHaptic('error');
      return;
    }

    const isCorrectPosition = currentChallenge.type === 'creativity' || 
                             draggedBlock.correctPosition === zone.position;
    
    if (isCorrectPosition) {
      playSound('correct');
      triggerHaptic('success');
      setComboCounter(prev => prev + 1);
      setShowMagicEffects(true);
      setTimeout(() => setShowMagicEffects(false), 1000);
    } else {
      playSound('incorrect');
      triggerHaptic('error');
    }

    setDropZones(prev => prev.map(z => {
      if (z.id === zoneId) {
        return {
          ...z,
          currentBlock: draggedBlock,
          isCorrect: isCorrectPosition,
          magneticField: false,
          isActive: false
        };
      }
      return { ...z, magneticField: false, isActive: false };
    }));

    setAvailableBlocks(prev => prev.filter(b => b.id !== draggedBlock.id));
    setDraggedBlock(null);
    
    checkCompletion();
  }, [draggedBlock, dropZones, currentChallenge, playSound, triggerHaptic, checkCompletion]);

  const checkCompletion = useCallback(() => {
    setTimeout(() => {
      const updatedZones = dropZones.filter(zone => zone.currentBlock !== null);
      
      if (updatedZones.length === currentChallenge.dropZones.length) {
        const allCorrect = currentChallenge.type === 'creativity' || 
                          updatedZones.every(zone => zone.isCorrect);
        
        // Record challenge result in session
        const challengeResult = {
          challengeId: currentChallenge.id,
          targetWord: currentChallenge.targetWord,
          isCorrect: allCorrect,
          timeSpent: timeElapsed,
          attempts: 1, // Could track multiple attempts
          mistakeType: allCorrect ? undefined : 'assembly'
        };
        
        // setSessionChallenges(prev => [...prev, challengeResult]); // This line was removed
        
        if (allCorrect) {
          setIsCompleted(true);
          playSound('levelup');
          triggerHaptic('success');
          
          setPlayerProgress(prev => ({
            ...prev,
            totalCrystals: prev.totalCrystals + 10,
            totalMagicPoints: prev.totalMagicPoints + 50,
            currentStreak: prev.currentStreak + 1,
            completedChallenges: new Set([...prev.completedChallenges, currentChallenge.id])
          }));
          
          // Update backend progress
          // updateProgress({ // This line was removed
          //   totalExercises: playerProgress.totalCrystals + 1,
          //   correctAnswers: playerProgress.totalMagicPoints + 1,
          //   currentStreak: playerProgress.currentStreak + 1
          // }).catch(error => { // This line was removed
          //   console.error('Error updating progress:', error); // This line was removed
          // }); // This line was removed
        } else {
          // Record mistake for spaced repetition
          const attemptedAnswer = updatedZones
            .map(zone => zone.currentBlock?.content || '')
            .join('');
          
          // recordMistake({ // This line was removed
          //   challengeId: currentChallenge.id, // This line was removed
          //   targetWord: currentChallenge.targetWord, // This line was removed
          //   attemptedAnswer, // This line was removed
          //   correctAnswer: currentChallenge.targetWord, // This line was removed
          //   mistakeType: 'assembly', // This line was removed
          //   difficulty: currentChallenge.difficulty, // This line was removed
          //   period: currentChallenge.period, // This line was removed
          //   retryCount: 0, // This line was removed
          //   spacedRepetitionLevel: 1 // This line was removed
          // }).catch(error => { // This line was removed
          //   console.error('Error recording mistake:', error); // This line was removed
          // }); // This line was removed
          
          // Update progress with mistake
          // updateProgress({ // This line was removed
          //   totalExercises: playerProgress.totalCrystals + 1, // This line was removed
          //   mistakes: (playerProgress.totalCrystals || 0) + 1, // This line was removed
          //   currentStreak: 0 // Reset streak on mistake // This line was removed
          // }).catch(error => { // This line was removed
          //   console.error('Error updating progress:', error); // This line was removed
          // }); // This line was removed
        }
      }
    }, 100);
  }, [dropZones, currentChallenge, timeElapsed, playSound, triggerHaptic, recordMistake, updateProgress, playerProgress]);

  const nextChallenge = useCallback(() => {
    if (currentChallengeIndex < challenges.length - 1) {
      setCurrentChallengeIndex(prev => prev + 1);
    } else {
      setCurrentChallengeIndex(0);
    }
  }, [currentChallengeIndex, challenges.length]);

  const prevChallenge = useCallback(() => {
    if (currentChallengeIndex > 0) {
      setCurrentChallengeIndex(prev => prev - 1);
    } else {
      setCurrentChallengeIndex(challenges.length - 1);
    }
  }, [currentChallengeIndex, challenges.length]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <SparkleElements />
        {showMagicEffects && <MagicElements />}
      </div>

      {/* Progress bar */}
      <div className="fixed top-4 left-4 z-50">
        <AnimatedCard variant="progress" className="w-64">
          <div className="text-center mb-2">
            <h3 className="text-sm font-bold text-gray-700">Progression</h3>
          </div>
          <ProgressBar 
            progress={((currentChallengeIndex + 1) / challenges.length) * 100} 
            variant="sparkle" 
            size="sm"
            showPercentage={true}
          />
        </AnimatedCard>
      </div>

      {/* Player stats */}
      <div className="fixed top-4 right-4 z-50">
        <AnimatedCard variant="reward" className="w-32 text-center">
          <div className="text-2xl font-bold text-yellow-600">{playerProgress.totalCrystals}</div>
          <div className="text-sm text-gray-600">Cristaux</div>
        </AnimatedCard>
      </div>

      {/* Main game area */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="max-w-6xl w-full">
          {/* Challenge info */}
          <AnimatedCard variant="exercise" className="mb-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                🪄 Défi {currentChallengeIndex + 1} sur {challenges.length}
              </h2>
              <p className="text-xl text-gray-600 mb-4">{currentChallenge.hint}</p>
              <div className="flex justify-center gap-4 text-sm">
                <span className={`px-3 py-1 rounded-lg font-bold ${
                  currentChallenge.difficulty === 'bronze' ? 'bg-yellow-500' :
                  currentChallenge.difficulty === 'silver' ? 'bg-gray-500' :
                  currentChallenge.difficulty === 'gold' ? 'bg-yellow-600' :
                  'bg-purple-500'
                } text-white`}>
                  {currentChallenge.difficulty.toUpperCase()}
                </span>
                <span className="bg-blue-500 px-3 py-1 rounded-lg font-bold text-white">
                  Période {currentChallenge.period}
                </span>
                <span className="bg-green-500 px-3 py-1 rounded-lg font-bold text-white">
                  {currentChallenge.type}
                </span>
              </div>
            </div>

            {/* Target word display */}
            <div className="bg-white/50 rounded-lg p-6 mb-6 text-center">
              <div className="text-6xl font-bold text-gray-800 mb-4">
                {currentChallenge.targetWord}
              </div>
              <div className="text-lg text-gray-600">
                Temps: {formatTime(timeElapsed)}
                {currentChallenge.timeLimit && ` / ${currentChallenge.timeLimit}s`}
              </div>
            </div>
          </AnimatedCard>

          {/* Game area */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Available blocks */}
            <AnimatedCard variant="default" className="p-6">
              <h3 className="text-white text-xl font-bold text-center mb-4">
                🧩 Blocs Disponibles
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {availableBlocks.map((block) => (
                  <motion.div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(block)}
                    className={`
                      ${block.size === 'petit' ? 'w-16 h-16 text-lg' :
                        block.size === 'moyen' ? 'w-20 h-20 text-xl' :
                        'w-24 h-24 text-2xl'}
                      rounded-xl bg-gradient-to-br ${block.color}
                      flex items-center justify-center text-white font-bold
                      cursor-grab active:cursor-grabbing shadow-lg border-2 border-white/30
                      hover:scale-110 transition-transform duration-200
                    `}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {block.content}
                  </motion.div>
                ))}
              </div>
            </AnimatedCard>

            {/* Drop zones */}
            <AnimatedCard variant="default" className="p-6">
              <h3 className="text-white text-xl font-bold text-center mb-4">
                🎯 Zone d'Assemblage
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {dropZones.map((zone) => (
                  <div
                    key={zone.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, zone.id)}
                    className={`
                      w-20 h-20 border-4 border-dashed rounded-xl
                      flex items-center justify-center
                      ${zone.magneticField ? 'border-yellow-400 bg-yellow-400/20' :
                        zone.currentBlock ? 
                          (zone.isCorrect ? 'border-green-400 bg-green-400/20' : 'border-red-400 bg-red-400/20') :
                          'border-gray-400 bg-gray-400/20'}
                      transition-all duration-200
                    `}
                  >
                    {zone.currentBlock && (
                      <div className={`
                        w-16 h-16 rounded-lg bg-gradient-to-br ${zone.currentBlock.color}
                        flex items-center justify-center text-white font-bold
                      `}>
                        {zone.currentBlock.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AnimatedCard>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-6">
            <motion.button
              onClick={prevChallenge}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ⬅️ Précédent
            </motion.button>
            
            <span className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold">
              {currentChallengeIndex + 1}/{challenges.length}
            </span>
            
            <motion.button
              onClick={nextChallenge}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Suivant ➡️
            </motion.button>
          </div>

          {/* Completion celebration */}
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              >
                <AnimatedCard variant="reward" className="max-w-md text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Félicitations !
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {currentChallenge.successMessage}
                  </p>
                  <motion.button
                    onClick={nextChallenge}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-2xl font-bold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🎮 Défi Suivant
                  </motion.button>
                </AnimatedCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}; 