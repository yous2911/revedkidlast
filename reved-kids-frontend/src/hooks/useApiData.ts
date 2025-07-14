import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse, ApiError } from '../types/api.types';
import { useErrorHandler } from './useErrorHandler';

export interface UseApiDataOptions<T> {
  initialData?: T;
  immediate?: boolean;
  dependencies?: any[];
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  transform?: (data: any) => T;
}

export interface UseApiDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
  retry: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useApiData<T = any>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiDataOptions<T> = {}
): UseApiDataReturn<T> {
  const {
    initialData = null,
    immediate = true,
    dependencies = [],
    retryCount = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    transform
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { handleApiError } = useErrorHandler();
  const abortControllerRef = useRef<AbortController | null>(null);
  const retriesRef = useRef(0);

  const execute = useCallback(async (): Promise<void> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      
      if (!response.success) {
        throw new ApiError(
          response.error?.message || 'Request failed',
          500,
          response.error?.code
        );
      }

      const resultData = transform ? transform(response.data) : response.data;
      if (resultData !== undefined) {
        setData(resultData);
        onSuccess?.(resultData);
      }
      retriesRef.current = 0;

    } catch (err) {
      const error = err as Error;
      setError(error);
      handleApiError(error);
      onError?.(error);

      // Auto-retry for network errors
      if (retriesRef.current < retryCount && 
          (error.name === 'NetworkError' || error.message.includes('fetch'))) {
        retriesRef.current++;
        setTimeout(() => {
          if (!abortControllerRef.current?.signal.aborted) {
            execute();
          }
        }, retryDelay * retriesRef.current);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, transform, onSuccess, onError, handleApiError, retryCount, retryDelay]);

  const retry = useCallback(async (): Promise<void> => {
    retriesRef.current = 0;
    await execute();
  }, [execute]);

  const refresh = useCallback(async (): Promise<void> => {
    // Force refresh by clearing cache if needed
    await execute();
  }, [execute]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setData(initialData);
    setLoading(false);
    setError(null);
    retriesRef.current = 0;
  }, [initialData]);

  // Execute on mount and dependency changes
  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, ...dependencies]);

  return {
    data,
    loading,
    error,
    execute,
    retry,
    refresh,
    reset
  };
} 