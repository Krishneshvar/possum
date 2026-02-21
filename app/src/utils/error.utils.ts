import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface QueryError {
  error?: string;
}

export function extractErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
  if (!error) return defaultMessage;
  
  const apiError = error as FetchBaseQueryError & QueryError;
  if (typeof apiError?.data === 'object' && apiError?.data && 'error' in apiError.data) {
    return String((apiError.data as QueryError).error || defaultMessage);
  }
  
  return defaultMessage;
}
