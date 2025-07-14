import { DefiPhonique, ApiResponse as SharedApiResponse } from '../types/shared';
import { ApiResponse as ApiTypesResponse } from '../types/api.types';
import { apiService } from './api.service';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class DefisService {
  async getAllDefis(): Promise<SharedApiResponse<DefiPhonique[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/defis/massifs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des défis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Add missing getDefisMassifs method
  async getDefisMassifs(niveauId?: number): Promise<SharedApiResponse<DefiPhonique[]>> {
    const params = niveauId ? `?niveau=${niveauId}` : '';
    const response = await apiService.get<DefiPhonique[]>(
      `/defis/massifs${params}`,
      { cache: true }
    );
    
    // Convert between ApiResponse types
    return {
      success: response.success,
      data: response.data,
      error: response.error?.message || response.error
    };
  }

  // Get defis by difficulty level
  async getDefisByDifficulte(difficulte: 'facile' | 'moyen' | 'difficile'): Promise<SharedApiResponse<DefiPhonique[]>> {
    const response = await apiService.get<DefiPhonique[]>(
      `/defis?difficulte=${difficulte}`,
      { cache: true }
    );
    
    return {
      success: response.success,
      data: response.data,
      error: response.error?.message || response.error
    };
  }

  // Get defis for specific mathematical concept
  async getDefisByConcept(concept: string): Promise<SharedApiResponse<DefiPhonique[]>> {
    const response = await apiService.get<DefiPhonique[]>(
      `/defis?concept=${encodeURIComponent(concept)}`,
      { cache: true }
    );
    
    return {
      success: response.success,
      data: response.data,
      error: response.error?.message || response.error
    };
  }
}

export const defisService = new DefisService(); 