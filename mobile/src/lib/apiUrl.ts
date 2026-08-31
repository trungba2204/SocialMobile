import Constants from 'expo-constants';

// Origin of the backend, e.g. http://localhost:8080 (no trailing /api).
export const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:8080';

// Axios baseURL — the API root.
export const API_BASE_URL = `${API_URL}/api`;
