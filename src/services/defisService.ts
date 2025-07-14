import { DefiPhonique, ApiResponse } from '../types/shared';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class DefisService {
  async getAllDefis(): Promise<ApiResponse<DefiPhonique[]>> {
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
}

export const defisService = new DefisService(); 