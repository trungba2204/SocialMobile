import type { ErrorEnvelope } from './types';

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function isAxiosLike(e: unknown): e is {
  response?: { status?: number; data?: unknown };
  request?: unknown;
  message?: string;
} {
  return typeof e === 'object' && e !== null;
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;

  if (isAxiosLike(e)) {
    const response = e.response;
    if (response) {
      const data = (response.data ?? {}) as Partial<ErrorEnvelope>;
      const status = response.status ?? data.status ?? 0;
      const fieldErrors: Record<string, string> = {};
      if (Array.isArray(data.fieldErrors)) {
        for (const fe of data.fieldErrors) {
          if (fe && typeof fe.field === 'string') {
            fieldErrors[fe.field] = fe.message ?? '';
          }
        }
      }
      const message =
        data.message ||
        data.error ||
        e.message ||
        `Request failed with status ${status}`;
      return new ApiError(message, status, fieldErrors);
    }

    if (e.request) {
      return new ApiError('No connection', 0);
    }

    if (typeof e.message === 'string') {
      return new ApiError(e.message, 0);
    }
  }

  return new ApiError('Something went wrong', 0);
}
