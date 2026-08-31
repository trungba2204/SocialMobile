import { ApiError, toApiError } from '@/api/errors';

describe('toApiError', () => {
  it('maps axios response with fieldErrors', () => {
    const err = {
      message: 'Request failed',
      response: {
        status: 422,
        data: {
          message: 'Validation failed',
          fieldErrors: [
            { field: 'username', message: 'taken' },
            { field: 'email', message: 'invalid' },
          ],
        },
      },
    };
    const api = toApiError(err);
    expect(api).toBeInstanceOf(ApiError);
    expect(api.status).toBe(422);
    expect(api.message).toBe('Validation failed');
    expect(api.fieldErrors).toEqual({ username: 'taken', email: 'invalid' });
  });

  it('maps a network error to status 0 / No connection', () => {
    const err = { message: 'Network Error', request: {} };
    const api = toApiError(err);
    expect(api.status).toBe(0);
    expect(api.message).toBe('No connection');
    expect(api.fieldErrors).toEqual({});
  });

  it('passes through an existing ApiError', () => {
    const orig = new ApiError('x', 400);
    expect(toApiError(orig)).toBe(orig);
  });
});
