import { useCallback, useMemo } from 'react';
import { studentService, StudentDashboard, StudentProgress } from '../services/student.service';
import { useApiData } from './useApiData';
import { ExercicePedagogique, TentativeExercice, TentativeResponse } from '../types/api.types';

export interface UseStudentDataReturn {
  // Student basic data
  student: StudentDashboard | null;
  studentLoading: boolean;
  studentError: Error | null;
  
  // Progress data
  progress: StudentProgress[] | null;
  progressLoading: boolean;
  
  // Recommendations
  recommendations: ExercicePedagogique[] | null;
  recommendationsLoading: boolean;
  
  // Actions
  refreshStudent: () => Promise<void>;
  submitExercise: (exerciseId: number, attempt: TentativeExercice) => Promise<TentativeResponse>;
  updateProfile: (updates: Partial<any>) => Promise<void>;
}

export function useStudentData(studentId: number): UseStudentDataReturn {
  // Fetch student dashboard
  const {
    data: student,
    loading: studentLoading,
    error: studentError,
    refresh: refreshStudent
  } = useApiData(
    () => studentService.getStudentDashboard(studentId),
    {
      immediate: true,
      dependencies: [studentId]
    }
  );

  // Fetch student progress
  const {
    data: progress,
    loading: progressLoading,
    refresh: refreshProgress
  } = useApiData(
    () => studentService.getStudentProgress(studentId),
    {
      immediate: true,
      dependencies: [studentId]
    }
  );

  // Fetch recommendations
  const {
    data: recommendations,
    loading: recommendationsLoading,
    refresh: refreshRecommendations
  } = useApiData(
    () => studentService.getRecommendations(studentId, 5),
    {
      immediate: true,
      dependencies: [studentId]
    }
  );

  // Submit exercise attempt
  const submitExercise = useCallback(async (
    exerciseId: number, 
    attempt: TentativeExercice
  ): Promise<TentativeResponse> => {
    const response = await studentService.submitExerciseAttempt(studentId, exerciseId, attempt);
    
    // Refresh data after successful submission
    if (response.success) {
      refreshStudent();
      refreshProgress();
      refreshRecommendations();
    }
    
    return response;
  }, [studentId, refreshStudent, refreshProgress, refreshRecommendations]);

  // Update student profile
  const updateProfile = useCallback(async (updates: Partial<any>): Promise<void> => {
    await studentService.updateStudentProfile(studentId, updates);
    refreshStudent();
  }, [studentId, refreshStudent]);

  // Memoized computed values
  const computedData = useMemo(() => ({
    totalExercises: student?.stats.totalExercises || 0,
    completedExercises: student?.stats.completedExercises || 0,
    successRate: student?.stats.successRate || 0,
    currentLevel: student?.eleve.niveauActuel || '',
    totalPoints: student?.eleve.totalPoints || 0,
    streak: student?.eleve.serieJours || 0
  }), [student]);

  return {
    // Data
    student,
    studentLoading,
    studentError,
    progress,
    progressLoading,
    recommendations,
    recommendationsLoading,
    
    // Actions
    refreshStudent,
    submitExercise,
    updateProfile,
    
    // Computed data
    ...computedData
  };
} 