import { ApiResponse, PaginatedResponse, ApiError, NetworkError } from '../types/api.types';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

export class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Cache management matching backend pattern
  private getCacheKey(url: string, config?: RequestConfig): string {
    const method = config?.method || 'GET';
    const body = config?.body ? JSON.stringify(config.body) : '';
    return `${method}:${url}:${body}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.requestCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // HTTP client with error handling matching backend
  async request<T = any>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 10000,
      retries = 3,
      cache = method === 'GET'
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = this.getCacheKey(url, config);

    // Check cache for GET requests
    if (cache && method === 'GET') {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers
    };

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout)
    };

    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    let lastError: Error = new NetworkError('Unknown error');
    
    // Retry logic matching backend pattern
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 API Request [${attempt}/${retries}]: ${method} ${url}`);
        
        const response = await fetch(url, requestConfig);
        const responseData = await response.json();

        // Handle HTTP errors
        if (!response.ok) {
          const errorMessage = responseData.error?.message || `HTTP ${response.status}`;
          const errorCode = responseData.error?.code || 'HTTP_ERROR';
          
          throw new ApiError(errorMessage, response.status, errorCode);
        }

        // Validate response structure (matching backend ApiResponse)
        if (typeof responseData.success !== 'boolean') {
          throw new ApiError('Invalid response format', 500, 'INVALID_RESPONSE');
        }

        // Cache successful GET responses
        if (cache && method === 'GET' && responseData.success) {
          this.setCache(cacheKey, responseData);
        }

        console.log(`✅ API Success: ${method} ${url}`);
        return responseData;

      } catch (error: unknown) {
        if (error instanceof ApiError) {
          lastError = error;
          // Don't retry client errors (4xx)
          if (error.status >= 400 && error.status < 500) {
            throw error;
          }
        } else if (error instanceof TypeError || (error as Error).name === 'AbortError') {
          lastError = new NetworkError('Connexion interrompue');
        } else {
          lastError = error as Error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retry in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`❌ API Failed after ${retries} attempts: ${method} ${url}`, lastError);
    throw lastError;
  }

  // Convenience methods matching backend endpoints
  async get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
  }

  async put<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  async delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Health check matching backend
  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this.get('/health', { timeout: 5000, cache: false });
      return { healthy: true, latency: Date.now() - start };
    } catch {
      return { healthy: false, latency: Date.now() - start };
    }
  }

  // Clear cache (useful for logout, data refresh)
  clearCache(): void {
    this.requestCache.clear();
  }

  // Set authentication header
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }
}

// Global instance
export const apiService = new ApiService(); 