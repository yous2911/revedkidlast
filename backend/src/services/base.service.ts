export abstract class BaseService {
  protected nomService: string = 'BaseService';

  protected log(message: string): void {
    console.log(`[${this.nomService}] ${message}`);
  }

  protected logError(message: string, error: any): void {
    console.error(`[${this.nomService}] ${message}:`, error);
  }

  protected logWarn(message: string): void {
    console.warn(`[${this.nomService}] ${message}`);
  }

  protected logInfo(message: string): void {
    console.info(`[${this.nomService}] ${message}`);
  }

  protected logDebug(message: string): void {
    if (process.env['NODE_ENV'] === 'development') {
      console.debug(`[${this.nomService}] ${message}`);
    }
  }

  protected handleError(error: any, context: string): never {
    this.logError(`Erreur dans ${context}`, error);
    throw error;
  }

  protected validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} est requis`);
    }
  }

  protected validateNumber(value: any, fieldName: string, min?: number, max?: number): void {
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`${fieldName} doit être un nombre`);
    }
    if (min !== undefined && num < min) {
      throw new Error(`${fieldName} doit être au moins ${min}`);
    }
    if (max !== undefined && num > max) {
      throw new Error(`${fieldName} doit être au maximum ${max}`);
    }
  }

  protected validateString(value: any, fieldName: string, minLength?: number, maxLength?: number): void {
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} doit être une chaîne de caractères`);
    }
    if (minLength !== undefined && value.length < minLength) {
      throw new Error(`${fieldName} doit contenir au moins ${minLength} caractères`);
    }
    if (maxLength !== undefined && value.length > maxLength) {
      throw new Error(`${fieldName} doit contenir au maximum ${maxLength} caractères`);
    }
  }

  protected validateEnum(value: any, fieldName: string, allowedValues: string[]): void {
    if (!allowedValues.includes(value)) {
      throw new Error(`${fieldName} doit être l'une des valeurs suivantes: ${allowedValues.join(', ')}`);
    }
  }

  protected sanitizeString(value: string): string {
    return value
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  protected generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  protected formatDate(date: Date | undefined | null): string {
    if (!date || typeof date.toISOString !== 'function') return '';
    return date.toISOString().split('T')[0] || '';
  }

  protected calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  protected paginateResults<T>(items: T[], page: number, limit: number): {
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
} 